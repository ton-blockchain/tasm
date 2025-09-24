import * as c from "./constructors"
import * as $ from "./util"
import type {Instr} from "./instr-gen"
import {CodeBuilder} from "./builder"
import {instr} from "./instr"
import {matchingRule} from "./layout"
import {IF, IFELSE, IFJMP, IFNOT, IFNOTJMP, PUSHCONT, PUSHCONT_SHORT} from "./types"
import type {StoreOptions} from "./util"

function isLastInstruction(index: number, instructions: Instr[]) {
    if (index === instructions.length - 1) {
        return true
    }

    if (instructions[index + 1]?.$ !== "DEBUGMARK") {
        // Fast path, if:
        // POPCTR
        // ADD
        //
        // instruction is not the last one
        return false
    }

    // if:
    // POPCTR
    // DEBUGMARK
    //
    // check that all remaining instructions are DEBUGMARK

    for (let i = index + 1; i < instructions.length; i++) {
        const instruction = instructions[i]
        if (instruction?.$ !== "DEBUGMARK") {
            // found non DEBUGMARK instruction in the tail, so instruction is not a last
            return false
        }
    }

    return true
}

export const compileInstructions = (
    b: CodeBuilder,
    instructions: Instr[],
    options: StoreOptions,
) => {
    for (let index = 0; index < instructions.length; index++) {
        const instruction = instructions[index]
        if (!instruction) break
        const builderBefore = new CodeBuilder().storeBuilder(b)

        const isLast = isLastInstruction(index, instructions)
        const overflow = safeStore(b, instruction, isLast, options)
        if (!overflow) {
            // fast path
            continue
        }

        // Handle case where instructions don't fit to the current cell.
        // In many cases, this happens at the if-else boundary, when the body
        // specified via PUSHCONT takes up a large number of bits. In this case, we
        // need to create a new ref and continue compiling the remaining instructions
        // into this ref
        const remainingInstructions = instructions.slice(index)

        // But we can try to optimize code like this:
        // ref {
        //   PUSHCONT { ... }
        //   IF
        //   ...
        // }
        // ->
        // IFREF { ... }
        // ...
        const match = matchingRule(remainingInstructions)
        if (match && builderBefore.canFit(/* IFREF length */ 16)) {
            const instr = match.rule.ctor(match.body)
            match.rule.type.store(builderBefore, instr, options)
            b.reinitFrom(builderBefore)
            index++ // advance to not store instruction once again

            // All instructions after PUSHCONT + IF will be compiled in the current cell and
            // placed in a new cell if necessary.
            continue
        }

        // Create a new ref and compile the remaining instruction to it
        $.PSEUDO_PUSHREF_ALWAYS.store(
            builderBefore,
            c.PSEUDO_PUSHREF($.code(remainingInstructions)),
            options,
        )
        b.reinitFrom(builderBefore)
        // All remaining instructions already processed in PSEUDO_PUSHREF,
        // so we need to return here
        return
    }
}

const compilePushcont = (
    b: CodeBuilder,
    code: $.Code,
    loc: $.Loc | undefined,
    options: StoreOptions,
) => {
    const b2 = new CodeBuilder()
    PUSHCONT.store(
        b2,
        {
            $: "PUSHCONT",
            arg0: code,
            loc,
        },
        options,
    )

    const pushcontWithoutCodeWidth = 16
    if (b2.bits - pushcontWithoutCodeWidth > 15) {
        PUSHCONT.store(
            b,
            {
                $: "PUSHCONT",
                arg0: code,
                loc,
            },
            options,
        )
    } else {
        PUSHCONT_SHORT.store(
            b,
            {
                $: "PUSHCONT_SHORT",
                arg0: code,
                loc,
            },
            options,
        )
    }
}

const compileNonRefIf = (b: CodeBuilder, instr: Instr, options: StoreOptions) => {
    if (instr.$ === "IFREF") {
        IF.store(
            b,
            {
                $: "IF",
                loc: instr.loc,
            },
            options,
        )
    }
    if (instr.$ === "IFREFELSE" || instr.$ === "IFELSEREF") {
        IFELSE.store(
            b,
            {
                $: "IFELSE",
                loc: instr.loc,
            },
            options,
        )
    }
    if (instr.$ === "IFNOTREF") {
        IFNOT.store(
            b,
            {
                $: "IFNOT",
                loc: instr.loc,
            },
            options,
        )
    }
    if (instr.$ === "IFJMPREF") {
        IFJMP.store(
            b,
            {
                $: "IFJMP",
                loc: instr.loc,
            },
            options,
        )
    }
    if (instr.$ === "IFNOTJMPREF") {
        IFNOTJMP.store(
            b,
            {
                $: "IFNOTJMP",
                loc: instr.loc,
            },
            options,
        )
    }
}

function compileIf(t: Instr, b: CodeBuilder, options: StoreOptions) {
    if (!options.skipRefs) {
        // compile as is
        return false
    }

    if (
        t.$ === "IFREF" ||
        t.$ === "IFREFELSE" ||
        t.$ === "IFELSEREF" ||
        t.$ === "IFNOTREF" ||
        t.$ === "IFJMPREF" ||
        t.$ === "IFNOTJMPREF"
    ) {
        try {
            const b2 = new CodeBuilder()

            // Try to compile, this code may throw an exception if PUSHCONT and IF doesn't fit into a single cell
            compilePushcont(b2, t.arg0, t.loc, options)
            compileNonRefIf(b2, t, options)

            if (b2.bits + b.bits <= 1023 && b2.refs + b.refs <= 4) {
                compilePushcont(b, t.arg0, t.loc, options)
                compileNonRefIf(b, t, options)
                return true
            }
        } catch {
            return false
        }
    }

    return false
}

const safeStore = (
    b: CodeBuilder,
    t: Instr,
    isLastInstruction: boolean,
    options: StoreOptions,
): boolean => {
    const inlined = compileIf(t, b, options)
    if (inlined) {
        return false
    }

    try {
        instr.store(b, t, options)
        if (b.bits >= 1023 - (b.isDictionaryCell ? b.offset : 0)) {
            return true
        }

        if (!isLastInstruction && options.skipRefs) {
            if (b.bits >= 1023 - 8) {
                // we need room for PUSHREF
                return true
            }
        }

        if (b.refs >= 4 && !isLastInstruction) {
            if (t.$ === "PSEUDO_PUSHREF" && b.refs === 4) {
                // In the case where the compiler itself has set the necessary `ref {}`,
                // we do not try to predict in advance whether there may be an overflow further,
                // since the compiler has already decomposed everything into correct refs
                return false
            }
            // In case of other instructions that push references, we cannot be sure, so
            // we handle this case explicitly.
            return true
        }
    } catch (error: unknown) {
        if (error instanceof Error) {
            if (
                error.message === "BitBuilder overflow" ||
                error.message === "Too many references"
            ) {
                return true
            }
        }

        throw error
    }

    return false
}
