import {parse} from "../parse/parse"
import {$ast} from "../parse/grammar"
import type {$ast as $astT} from "../../text/grammar"
import * as $ from "@tonstudio/parser-runtime"
import {type Ctx, print, processInstructions} from "../../text"
import type {DecompiledDict, DecompiledMethod} from "../../runtime/util"
import {Hash} from "../../runtime/util"
import type {Instr} from "../../runtime"
import {
    compileCell,
    decompileCell,
    DICTIGETJMPZ,
    DICTPUSHCONST,
    SETCP,
    THROWARG,
} from "../../runtime"
import {execSync} from "node:child_process"
import {existsSync, readFileSync, rmSync, writeFileSync} from "node:fs"
import {Cell} from "@ton/core"
import {diffLines} from "diff"
import Instruction = $ast.Instruction

export interface CompilationContext {
    readonly functions: ReadonlyMap<string, number>
    readonly compiledFunctions: ReadonlyMap<string, CompiledDefinition>
    readonly globals: ReadonlyMap<string, number>
    usedFunctions: Map<string, number>
}

function compileFift(code: string) {
    if (existsSync("out.boc")) {
        rmSync("out.boc")
    }
    writeFileSync("1.fif", code + '\n\nboc>B "out.boc" B>file')
    execSync(
        "/Users/petrmakhnev/ton-tolk/cmake-build-debug/crypto/fift -I /Users/petrmakhnev/ton-tolk/crypto/fift/lib 1.fif",
    )
    return Cell.fromBoc(readFileSync("out.boc"))[0] ?? new Cell()
}

// eslint-disable-next-line @typescript-eslint/require-await
const main = async () => {
    const _ = `
    "Asm.fif" include
    // automatically generated from 1.tolk
    PROGRAM{
      DECLGLOBVAR $foo
      DECLGLOBVAR $bar
      0 DECLMETHOD onInternalMessage()
      DECLPROC foo()
      foo() PROC:<{
        ADD 
      }>
      onInternalMessage() PROC:<{
        11 PUSHINT
        0 THROWIF
        x{1} SDBEGINSQ
        IFJMP:<{
          256 PLDI
          THROWANY
        }>
        x{2} SDBEGINSQ
        IFJMP:<{
          256 LDSLICE
          DROP
          HASHSU
          THROWANY
        }>
        foo() CALLDICT
        $bar SETGLOB
        3 THROW
      }>
    }END>c
    `

    const code = readFileSync("wallet_v5.now.fif", "utf8")

    const result = parse("test.fift", code)
    if (result.$ === "ParseFailure") {
        throw result.error
    }

    const functions: Map<string, number> = new Map()
    const globals: Map<string, number> = new Map()
    const compiledFunctions: Map<string, CompiledDefinition> = new Map()
    const usedFunctions: Map<string, number> = new Map()

    let functionIdx = 1
    let globalIdx = 1
    for (const decl of result.ast.program.declarations) {
        const name = decl.decl.name.name
        if (decl.decl.$ === "ProcDeclaration") {
            functions.set(name, functionIdx)
            functionIdx++
        }

        if (decl.decl.$ === "MethodDeclaration") {
            functions.set(name, Number.parseInt(decl.decl.method_id.value))
            usedFunctions.set(name, 1)
        }

        if (decl.decl.$ === "GlobalVar") {
            globals.set(name, globalIdx)
            globalIdx++
        }
    }

    const ctx: CompilationContext = {
        functions,
        globals,
        usedFunctions,
        compiledFunctions,
    }

    const methods = result.ast.program.definitions.map(def => {
        const definition = compileDefinition(def, ctx)
        compiledFunctions.set(def.def.name.name, definition)
        return definition.compiled
    })

    const usedMethods = methods.filter(method => {
        const func = ctx.functions.entries().find(([, id]) => method.id === id)
        if (!func) return true
        const [name] = func
        const usageCount = ctx.usedFunctions.get(name) ?? 0
        return usageCount > 0
    })

    const mainDictionary: DecompiledDict = {
        $: "DecompiledDict",
        methods: usedMethods,
    }

    const toplevel: Instr[] = [
        SETCP(0),
        DICTPUSHCONST(19, mainDictionary),
        DICTIGETJMPZ(),
        THROWARG(11),
    ]

    const cell = compileCell(toplevel)

    const text = print(decompileCell(cell))
    console.log("TASM:\n\n", text)
    writeFileSync("out.tasm.compiled", text)

    const fiftCell = compileFift(code)
    const fiftText = print(decompileCell(fiftCell))
    console.log("Fift:\n\n", fiftText)
    writeFileSync("out.fif.compiled", fiftText)

    if (cell.toString() !== fiftCell.toString()) {
        console.log(diffLines(cell.toString(), fiftCell.toString()))
        console.log(diffLines(text, fiftText))
        throw new Error("Mismatch with Fift")
    }

    console.log("Compilation succeed")
}

interface CompiledDefinition {
    readonly inline: "inline" | "inline_ref" | "unspecified"
    readonly compiled: DecompiledMethod
    readonly processed: $astT.Instruction[]
}

function compileDefinition(def: $ast.Definition, ctx: CompilationContext): CompiledDefinition {
    const rawInstructions = def.def.instructions.flatMap(it => compileInstruction(ctx, it))

    const id = ctx.functions.get(def.def.name.name)
    if (id === undefined) {
        throw new Error("Add function declaration")
    }

    const parserCtx: Ctx = {lines: [], filepath: ""}
    const instructions = processInstructions(parserCtx, rawInstructions)
    const compiled: DecompiledMethod = {
        $: "DecompiledMethod",
        id,
        instructions,
    }

    const inline =
        def.def.$ === "ProcInlineDefinition"
            ? "inline"
            : def.def.$ === "ProcRefDefinition"
              ? "inline_ref"
              : "unspecified"

    return {inline, compiled, processed: rawInstructions}
}

function integerArgument(value: number): $astT.Argument {
    return {
        $: "Argument",
        expression: {
            $: "IntegerLiteral",
            value: {
                $: "IntegerLiteralDec",
                digits: value.toString(),
                loc: $.emptyLoc(0),
            },
            op: undefined,
            loc: $.emptyLoc(0),
        },
        loc: $.emptyLoc(0),
    }
}

function compileInstruction(ctx: CompilationContext, raw: Instruction): $astT.Instruction[] {
    const instr = raw.instr
    switch (instr.$) {
        case "AsmExpression": {
            const args = instr.arguments?.primitives.map(it => convertPrimitive(ctx, it)) ?? []

            if (instr.name.value === "INLINECALLDICT") {
                const nameNode = instr.arguments?.primitives[0]?.prim
                const name = nameNode?.$ === "ArgIdentifier" ? nameNode.name : ""
                const code = ctx.compiledFunctions.get(name)
                if (!code) {
                    return [
                        {
                            $: "Instruction",
                            args,
                            name: {
                                $: "Id",
                                name: `CALLDICT`,
                                loc: $.emptyLoc(0),
                            },
                            loc: $.emptyLoc(0),
                        },
                    ]
                }

                if (code.inline === "inline") {
                    // remove this usage
                    const prevValue = ctx.usedFunctions.get(name) ?? 0
                    ctx.usedFunctions.set(name, prevValue - 1)
                    return code.processed
                }

                if (code.inline === "inline_ref") {
                    // remove this usage
                    const prevValue = ctx.usedFunctions.get(name) ?? 0
                    ctx.usedFunctions.set(name, prevValue - 1)
                    return [
                        {
                            $: "Instruction",
                            args: [
                                {
                                    $: "Argument",
                                    expression: {
                                        $: "Code",
                                        instructions: code.processed,
                                        loc: $.emptyLoc(0),
                                    },
                                    loc: $.emptyLoc(0),
                                },
                            ],
                            name: {
                                $: "Id",
                                name: `CALLREF`,
                                loc: $.emptyLoc(0),
                            },
                            loc: $.emptyLoc(0),
                        },
                    ]
                }

                return code.processed
            }

            // special Fift instructions with special (smart) handling
            if (
                instr.name.value === "PUSHINT" ||
                instr.name.value === "PUSHSLICE" ||
                instr.name.value === "PUSHCONT" ||
                instr.name.value === "STSLICECONST" ||
                instr.name.value === "XCHG" ||
                instr.name.value === "PUSHINTX" ||
                instr.name.value === "SDBEGINS" ||
                instr.name.value === "SDBEGINSQ" ||
                instr.name.value === "CALLXARGS" ||
                instr.name.value === "CALLDICT" ||
                instr.name.value === "JMPDICT" ||
                instr.name.value === "PREPAREDICT" ||
                instr.name.value === "THROW" ||
                instr.name.value === "THROWIF" ||
                instr.name.value === "THROWIFNOT"
            ) {
                return [
                    {
                        $: "Instruction",
                        args,
                        name: {
                            $: "Id",
                            name: `f${instr.name.value}`,
                            loc: $.emptyLoc(0),
                        },
                        loc: $.emptyLoc(0),
                    },
                ]
            }

            if (
                instr.name.value === "PUSH" ||
                instr.name.value === "POP" ||
                instr.name.value === "SAVE"
            ) {
                const [arg] = args

                if (!arg) {
                    throw new Error("Expected argument")
                }

                if (arg.expression.$ === "ControlRegister") {
                    return [
                        {
                            $: "Instruction",
                            args,
                            name: {
                                $: "Id",
                                name: `${instr.name.value}CTR`,
                                loc: $.emptyLoc(0),
                            },
                            loc: $.emptyLoc(0),
                        },
                    ]
                }

                return [
                    {
                        $: "Instruction",
                        args,
                        name: {
                            $: "Id",
                            name: instr.name.value,
                            loc: $.emptyLoc(0),
                        },
                        loc: $.emptyLoc(0),
                    },
                ]
            }

            if (instr.name.value === "-ROLL") {
                return [
                    {
                        $: "Instruction",
                        args: [...args, integerArgument(0)],
                        name: {
                            $: "Id",
                            name: "BLKSWAP",
                            loc: $.emptyLoc(0),
                        },
                        loc: $.emptyLoc(0),
                    },
                ]
            }

            if (instr.name.value === "ROLL") {
                return [
                    {
                        $: "Instruction",
                        args: [integerArgument(0), ...args],
                        name: {
                            $: "Id",
                            name: "BLKSWAP",
                            loc: $.emptyLoc(0),
                        },
                        loc: $.emptyLoc(0),
                    },
                ]
            }

            if (instr.name.value === "FALSE") {
                return [
                    {
                        $: "Instruction",
                        args: [integerArgument(0)],
                        name: {
                            $: "Id",
                            name: "PUSHINT_4",
                            loc: $.emptyLoc(0),
                        },
                        loc: $.emptyLoc(0),
                    },
                ]
            }

            if (instr.name.value === "TRUE") {
                return [
                    {
                        $: "Instruction",
                        args: [integerArgument(-1)],
                        name: {
                            $: "Id",
                            name: "PUSHINT_4",
                            loc: $.emptyLoc(0),
                        },
                        loc: $.emptyLoc(0),
                    },
                ]
            }

            if (instr.name.value === "ONE") {
                return [
                    {
                        $: "Instruction",
                        args: [integerArgument(1)],
                        name: {
                            $: "Id",
                            name: "PUSHINT_4",
                            loc: $.emptyLoc(0),
                        },
                        loc: $.emptyLoc(0),
                    },
                ]
            }

            if (instr.name.value === "FIRST") {
                return [
                    {
                        $: "Instruction",
                        args: [integerArgument(0)],
                        name: {
                            $: "Id",
                            name: "INDEX",
                            loc: $.emptyLoc(0),
                        },
                        loc: $.emptyLoc(0),
                    },
                ]
            }

            if (instr.name.value === "SKIPOPTREF") {
                return [
                    {
                        $: "Instruction",
                        args,
                        name: {
                            $: "Id",
                            name: "SKIPDICT",
                            loc: $.emptyLoc(0),
                        },
                        loc: $.emptyLoc(0),
                    },
                ]
            }

            if (instr.name.value === "LDOPTREF") {
                return [
                    {
                        $: "Instruction",
                        args,
                        name: {
                            $: "Id",
                            name: "LDDICT",
                            loc: $.emptyLoc(0),
                        },
                        loc: $.emptyLoc(0),
                    },
                ]
            }

            if (instr.name.value === "PLDOPTREF") {
                return [
                    {
                        $: "Instruction",
                        args,
                        name: {
                            $: "Id",
                            name: "PLDDICT",
                            loc: $.emptyLoc(0),
                        },
                        loc: $.emptyLoc(0),
                    },
                ]
            }

            if (instr.name.value === "STOPTREF") {
                return [
                    {
                        $: "Instruction",
                        args,
                        name: {
                            $: "Id",
                            name: "STDICT",
                            loc: $.emptyLoc(0),
                        },
                        loc: $.emptyLoc(0),
                    },
                ]
            }

            if (instr.name.value === "PLDREF") {
                return [
                    {
                        $: "Instruction",
                        args: [integerArgument(0)],
                        name: {
                            $: "Id",
                            name: "PLDREFIDX",
                            loc: $.emptyLoc(0),
                        },
                        loc: $.emptyLoc(0),
                    },
                ]
            }

            if (instr.name.value.startsWith("HASHEXT_")) {
                const hashName = instr.name.value.slice("HASHEXT_".length)

                const hashId =
                    hashName === "SHA256"
                        ? Hash.SHA256
                        : hashName === "SHA512"
                          ? Hash.SHA512
                          : hashName === "BLAKE2B"
                            ? Hash.BLAKE2B
                            : hashName === "KECCAK256"
                              ? Hash.KECCAK256
                              : hashName === "KECCAK512"
                                ? Hash.KECCAK512
                                : 1

                return [
                    {
                        $: "Instruction",
                        args: [integerArgument(hashId)],
                        name: {
                            $: "Id",
                            name: "HASHEXT",
                            loc: $.emptyLoc(0),
                        },
                        loc: $.emptyLoc(0),
                    },
                ]
            }

            return [
                {
                    $: "Instruction",
                    args,
                    name: {
                        $: "Id",
                        name: instr.name.value,
                        loc: $.emptyLoc(0),
                    },
                    loc: $.emptyLoc(0),
                },
            ]
        }
        case "IfStatement": {
            const hasElse = instr.else_block !== undefined
            const negated = instr.kind === "IFNOT:<{"

            const IF: $astT.Instruction = {
                $: "Instruction",
                name: {
                    $: "Id",
                    name: hasElse ? "IFELSE" : negated ? "IFNOT" : "IF",
                    loc: $.emptyLoc(0),
                },
                args: [],
                loc: $.emptyLoc(0),
            }
            const trueBranch: $astT.Instruction = {
                $: "Instruction",
                name: {
                    $: "Id",
                    name: "fPUSHCONT",
                    loc: $.emptyLoc(0),
                },
                args: [
                    {
                        $: "Argument",
                        expression: {
                            $: "Code",
                            instructions: instr.instructions.flatMap(it =>
                                compileInstruction(ctx, it),
                            ),
                            loc: $.emptyLoc(0),
                        },
                        loc: $.emptyLoc(0),
                    },
                ],
                loc: $.emptyLoc(0),
            }
            const bodies = [trueBranch]
            if (instr.else_block) {
                const falseBranch: $astT.Instruction = {
                    $: "Instruction",
                    name: {
                        $: "Id",
                        name: "fPUSHCONT",
                        loc: $.emptyLoc(0),
                    },
                    args: [
                        {
                            $: "Argument",
                            expression: {
                                $: "Code",
                                instructions: instr.else_block.instructions.flatMap(it =>
                                    compileInstruction(ctx, it),
                                ),
                                loc: $.emptyLoc(0),
                            },
                            loc: $.emptyLoc(0),
                        },
                    ],
                    loc: $.emptyLoc(0),
                }
                bodies.push(falseBranch)
            }

            if (instr.kind === "IFNOT:<{") {
                // IFNOT:<{ 1 }>ELSE<{ 2 }>
                // bodies: [1, 2]
                // ->
                // [2, 1] IFELSE
                bodies.reverse()
            }

            return [...bodies, IF]
        }
        case "IfjmpStatement": {
            const negated = instr.kind === "IFNOTJMP:<{"
            const IFJMP: $astT.Instruction = {
                $: "Instruction",
                name: {
                    $: "Id",
                    name: negated ? "IFNOTJMP" : "IFJMP",
                    loc: $.emptyLoc(0),
                },
                args: [],
                loc: $.emptyLoc(0),
            }
            const PUSHCONT: $astT.Instruction = {
                $: "Instruction",
                name: {
                    $: "Id",
                    name: "fPUSHCONT",
                    loc: $.emptyLoc(0),
                },
                args: [
                    {
                        $: "Argument",
                        expression: {
                            $: "Code",
                            instructions: instr.instructions.flatMap(it =>
                                compileInstruction(ctx, it),
                            ),
                            loc: $.emptyLoc(0),
                        },
                        loc: $.emptyLoc(0),
                    },
                ],
                loc: $.emptyLoc(0),
            }
            return [PUSHCONT, IFJMP]
        }
        case "WhileStatement": {
            const WHILE: $astT.Instruction = {
                $: "Instruction",
                name: {
                    $: "Id",
                    name: "WHILE",
                    loc: $.emptyLoc(0),
                },
                args: [],
                loc: $.emptyLoc(0),
            }
            const condition: $astT.Instruction = {
                $: "Instruction",
                name: {
                    $: "Id",
                    name: "fPUSHCONT",
                    loc: $.emptyLoc(0),
                },
                args: [
                    {
                        $: "Argument",
                        expression: {
                            $: "Code",
                            instructions: instr.condition.flatMap(it =>
                                compileInstruction(ctx, it),
                            ),
                            loc: $.emptyLoc(0),
                        },
                        loc: $.emptyLoc(0),
                    },
                ],
                loc: $.emptyLoc(0),
            }
            const body: $astT.Instruction = {
                $: "Instruction",
                name: {
                    $: "Id",
                    name: "fPUSHCONT",
                    loc: $.emptyLoc(0),
                },
                args: [
                    {
                        $: "Argument",
                        expression: {
                            $: "Code",
                            instructions: instr.body.flatMap(it => compileInstruction(ctx, it)),
                            loc: $.emptyLoc(0),
                        },
                        loc: $.emptyLoc(0),
                    },
                ],
                loc: $.emptyLoc(0),
            }
            return [condition, body, WHILE]
        }
        case "RepeatStatement": {
            throw new Error('Not implemented yet: "RepeatStatement" case')
        }
        case "UntilStatement": {
            throw new Error('Not implemented yet: "UntilStatement" case')
        }
    }

    throw new Error("Unexpected error")
}

function convertPrimitive(ctx: CompilationContext, raw: $ast.AsmPrimitive): $astT.Argument {
    const primitive = raw.prim
    switch (primitive.$) {
        case "InstructionBlock":
            return {
                $: "Argument",
                expression: {
                    $: "Code",
                    instructions: primitive.instructions.flatMap(it => compileInstruction(ctx, it)),
                    loc: $.emptyLoc(0),
                },
                loc: $.emptyLoc(0),
            }
        case "String":
            return {
                $: "Argument",
                expression: {
                    $: "DataLiteral",
                    value: {
                        $: "StringLiteral",
                        value: primitive.content,
                        loc: $.emptyLoc(0),
                    },
                    loc: $.emptyLoc(0),
                },
                loc: $.emptyLoc(0),
            }
        case "HexBitString":
            return {
                $: "Argument",
                expression: {
                    $: "DataLiteral",
                    value: {
                        $: "HexLiteral",
                        content: primitive.content,
                        loc: $.emptyLoc(0),
                    },
                    loc: $.emptyLoc(0),
                },
                loc: $.emptyLoc(0),
            }
        case "BinBitString":
            return {
                $: "Argument",
                expression: {
                    $: "DataLiteral",
                    value: {
                        $: "BinLiteral",
                        content: primitive.content,
                        loc: $.emptyLoc(0),
                    },
                    loc: $.emptyLoc(0),
                },
                loc: $.emptyLoc(0),
            }
        case "BocHex":
            return {
                $: "Argument",
                expression: {
                    $: "DataLiteral",
                    value: {
                        $: "BocLiteral",
                        content: primitive.content,
                        loc: $.emptyLoc(0),
                    },
                    loc: $.emptyLoc(0),
                },
                loc: $.emptyLoc(0),
            }
        case "StackRegister":
            return {
                $: "Argument",
                expression: {
                    $: "StackElement",
                    value: primitive.value,
                    loc: $.emptyLoc(0),
                },
                loc: $.emptyLoc(0),
            }
        case "ControlRegister":
            return {
                $: "Argument",
                expression: {
                    $: "ControlRegister",
                    value: primitive.value,
                    loc: $.emptyLoc(0),
                },
                loc: $.emptyLoc(0),
            }
        case "Integer":
            return {
                $: "Argument",
                expression: {
                    $: "IntegerLiteral",
                    value: {
                        $: "IntegerLiteralDec",
                        digits: primitive.value,
                        loc: $.emptyLoc(0),
                    },
                    op: undefined,
                    loc: $.emptyLoc(0),
                },
                loc: $.emptyLoc(0),
            }
        case "ArgIdentifier":
            const prevValue = ctx.usedFunctions.get(primitive.name) ?? 0
            ctx.usedFunctions.set(primitive.name, prevValue + 1)

            const declIdx = ctx.functions.get(primitive.name) ?? ctx.globals.get(primitive.name)
            if (declIdx === undefined) {
                throw new Error(`Unknown name ${primitive.name}`)
            }
            return integerArgument(declIdx)
    }

    throw new Error("Unexpected error")
}

void main()
