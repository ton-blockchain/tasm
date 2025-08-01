import Instruction = $ast.Instruction
import type * as G from "../parse/grammar"
import {$ast} from "../parse/grammar"
import type {$ast as $astT} from "../../text/grammar"
import * as $ from "@tonstudio/parser-runtime"
import type {Ctx} from "../../text"
import {processInstructions} from "../../text"
import type {DecompiledDict, DecompiledMethod} from "../../runtime/util"
import {Hash} from "../../runtime/util"
import {parse} from "../parse/parse"
import type {Instr} from "../../runtime"
import {DICTIGETJMPZ, DICTPUSHCONST, SETCP, THROWARG} from "../../runtime"

export function compile(sourceName: string, content: string) {
    const result = parse(sourceName, content)
    if (result.$ === "ParseFailure") {
        const pos = result.error.position
        console.error(
            `Parse error: ${result.error.message}${pos === undefined ? "" : ` at position ${pos.start.line}:${pos.start.column}`}`,
        )
        process.exit(1)
    }

    const ctx = processAst(result.ast)

    const methods = result.ast.program.definitions.map(def => {
        const definition = compileDefinition(def, ctx)
        ctx.compiledFunctions.set(def.def.name.name, definition)
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
    return toplevel
}

export interface CompilationContext {
    readonly functions: ReadonlyMap<string, number>
    readonly globals: ReadonlyMap<string, number>
    readonly compiledFunctions: Map<string, CompiledDefinition>
    readonly usedFunctions: Map<string, number>
}

export function processAst(ast: G.$ast.SourceFile) {
    const functions: Map<string, number> = new Map()
    const globals: Map<string, number> = new Map()
    const compiledFunctions: Map<string, CompiledDefinition> = new Map()
    const usedFunctions: Map<string, number> = new Map()

    let functionIdx = 1
    let globalIdx = 1

    for (const decl of ast.program.declarations) {
        const name = decl.decl.name.name
        if (decl.decl.$ === "ProcDeclaration") {
            if (name === "recv_internal") {
                functions.set(name, 0)
                usedFunctions.set(name, 1)
                continue
            }

            if (name === "recv_external") {
                functions.set(name, -1)
                usedFunctions.set(name, 1)
                continue
            }

            if (name === "run_ticktock") {
                functions.set(name, -2)
                usedFunctions.set(name, 1)
                continue
            }

            if (name === "split_prepare") {
                functions.set(name, -3)
                usedFunctions.set(name, 1)
                continue
            }

            if (name === "split_install") {
                functions.set(name, -4)
                usedFunctions.set(name, 1)
                continue
            }

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
    return ctx
}

interface CompiledDefinition {
    readonly inline: "inline" | "inline_ref" | "unspecified"
    readonly compiled: DecompiledMethod
    readonly processed: $astT.Instruction[]
}

export function compileDefinition(
    def: $ast.Definition,
    ctx: CompilationContext,
): CompiledDefinition {
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

function newInstruction(name: string, args: readonly $astT.Argument[]): $astT.Instruction {
    return {
        $: "Instruction",
        args,
        name: {
            $: "Id",
            name,
            loc: $.emptyLoc(0),
        },
        loc: $.emptyLoc(0),
    }
}

function compileInstruction(ctx: CompilationContext, raw: Instruction): $astT.Instruction[] {
    const instr = raw.instr
    switch (instr.$) {
        case "AsmExpression": {
            const name = instr.name.value
            const args = instr.arguments?.primitives.map(it => convertPrimitive(ctx, it)) ?? []

            if (name === "INLINECALLDICT") {
                const nameNode = instr.arguments?.primitives[0]?.prim
                const name = nameNode?.$ === "ArgIdentifier" ? nameNode.name : ""
                const code = ctx.compiledFunctions.get(name)
                if (!code) {
                    return [newInstruction("CALLDICT", args)]
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
                        newInstruction("CALLREF", [
                            {
                                $: "Argument",
                                expression: {
                                    $: "Code",
                                    instructions: code.processed,
                                    loc: $.emptyLoc(0),
                                },
                                loc: $.emptyLoc(0),
                            },
                        ]),
                    ]
                }

                return code.processed
            }

            // special Fift instructions with special (smart) handling
            if (
                name === "PUSHINT" ||
                name === "PUSHSLICE" ||
                name === "PUSHCONT" ||
                name === "STSLICECONST" ||
                name === "XCHG" ||
                name === "PUSHINTX" ||
                name === "SDBEGINS" ||
                name === "SDBEGINSQ" ||
                name === "CALLXARGS" ||
                name === "CALLDICT" ||
                name === "JMPDICT" ||
                name === "PREPAREDICT" ||
                name === "THROW" ||
                name === "THROWIF" ||
                name === "THROWIFNOT"
            ) {
                return [newInstruction(`f${name}`, args)]
            }

            if (name === "PUSH" || name === "POP" || name === "SAVE") {
                const [arg] = args

                if (!arg) {
                    throw new Error("Expected argument")
                }

                if (arg.expression.$ === "ControlRegister") {
                    return [newInstruction(`${name}CTR`, args)]
                }

                // TODO: POP_LONG/PUSH_LONG
                return [newInstruction(name, args)]
            }

            switch (name) {
                case "-ROT": {
                    return [newInstruction("ROTREV", args)]
                }
                case "-ROLL": {
                    return [newInstruction("BLKSWAP", [...args, integerArgument(1)])]
                }
                case "ROLL": {
                    return [newInstruction("BLKSWAP", [integerArgument(1), ...args])]
                }
                case "FALSE": {
                    return [newInstruction("PUSHINT_4", [integerArgument(0)])]
                }
                case "TRUE": {
                    return [newInstruction("PUSHINT_4", [integerArgument(-1)])]
                }
                case "ONE": {
                    return [newInstruction("PUSHINT_4", [integerArgument(1)])]
                }
                case "FIRST": {
                    return [newInstruction("INDEX", [integerArgument(0)])]
                }
                case "SECOND": {
                    return [newInstruction("INDEX", [integerArgument(1)])]
                }
                case "THIRD": {
                    return [newInstruction("INDEX", [integerArgument(2)])]
                }
                case "SKIPOPTREF": {
                    return [newInstruction("SKIPDICT", args)]
                }
                case "LDOPTREF": {
                    return [newInstruction("LDDICT", args)]
                }
                case "PLDOPTREF": {
                    return [newInstruction("PLDDICT", args)]
                }
                case "STOPTREF": {
                    return [newInstruction("STDICT", args)]
                }
                case "PLDREF": {
                    return [newInstruction("PLDREFIDX", [integerArgument(0)])]
                }
                case "SETCONTMANY": {
                    return [newInstruction("SETCONTCTRMANY", args)]
                }
                case "COMPOSALT": {
                    return [newInstruction("BOOLOR", args)]
                }
                case "COMPOS": {
                    return [newInstruction("BOOLAND", args)]
                }
                case "LDVARUINT16": {
                    return [newInstruction("LDGRAMS", args)]
                }
                case "STVARUINT16": {
                    return [newInstruction("STGRAMS", args)]
                }
                case "NEWDICT": {
                    return [newInstruction("PUSHNULL", args)]
                }
                case "PAIR":
                case "CONS": {
                    return [newInstruction("TUPLE", [integerArgument(2)])]
                }
            }

            if (name.startsWith("HASHEXT_")) {
                const hashName = name.slice("HASHEXT_".length)

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

                return [newInstruction("HASHEXT", [integerArgument(hashId)])]
            }

            return [newInstruction(name, args)]
        }
        case "IfStatement": {
            const hasElse = instr.else_block !== undefined
            const negated = instr.kind === "IFNOT:<{"

            const trueBranchCode: $astT.Code = {
                $: "Code",
                instructions: instr.instructions.flatMap(it => compileInstruction(ctx, it)),
                loc: $.emptyLoc(0),
            }

            let falseBranchCode: $astT.Code | undefined = undefined
            if (instr.else_block) {
                falseBranchCode = {
                    $: "Code",
                    instructions: instr.else_block.instructions.flatMap(it =>
                        compileInstruction(ctx, it),
                    ),
                    loc: $.emptyLoc(0),
                }
            }

            const kind = hasElse ? "IFELSE" : negated ? "IFNOT" : "IF"

            const bodies: $astT.Argument[] = [
                {
                    $: "Argument",
                    expression: trueBranchCode,
                    loc: $.emptyLoc(0),
                },
                ...(falseBranchCode
                    ? [
                          {
                              $: "Argument" as const,
                              expression: falseBranchCode,
                              loc: $.emptyLoc(0),
                          },
                      ]
                    : []),
            ]

            if (instr.kind === "IFNOT:<{" && hasElse) {
                // For IFNOT:<{ true }>ELSE<{ false }> we need to swap the branches
                // and change kind to IFELSE
                bodies.reverse()
            }

            const IF = newInstruction("fIF", [
                {
                    $: "Argument",
                    expression: {
                        $: "DataLiteral",
                        value: {
                            $: "StringLiteral",
                            value: kind,
                            loc: $.emptyLoc(0),
                        },
                        loc: $.emptyLoc(0),
                    },
                    loc: $.emptyLoc(0),
                },
                ...bodies,
            ])

            return [IF]
        }
        case "IfjmpStatement": {
            const negated = instr.kind === "IFNOTJMP:<{"
            const kind = negated ? "IFNOTJMP" : "IFJMP"

            const trueBranchCode: $astT.Code = {
                $: "Code",
                instructions: instr.instructions.flatMap(it => compileInstruction(ctx, it)),
                loc: $.emptyLoc(0),
            }

            const IFJMP = newInstruction("fIF", [
                {
                    $: "Argument",
                    expression: {
                        $: "DataLiteral",
                        value: {
                            $: "StringLiteral",
                            value: kind,
                            loc: $.emptyLoc(0),
                        },
                        loc: $.emptyLoc(0),
                    },
                    loc: $.emptyLoc(0),
                },
                {
                    $: "Argument",
                    expression: trueBranchCode,
                    loc: $.emptyLoc(0),
                },
            ])

            return [IFJMP]
        }
        case "WhileStatement": {
            const WHILE = newInstruction("WHILE", [])
            const condition = newInstruction("fPUSHCONT", [
                {
                    $: "Argument",
                    expression: {
                        $: "Code",
                        instructions: instr.condition.flatMap(it => compileInstruction(ctx, it)),
                        loc: $.emptyLoc(0),
                    },
                    loc: $.emptyLoc(0),
                },
            ])
            const body = newInstruction("fPUSHCONT", [
                {
                    $: "Argument",
                    expression: {
                        $: "Code",
                        instructions: instr.body.flatMap(it => compileInstruction(ctx, it)),
                        loc: $.emptyLoc(0),
                    },
                    loc: $.emptyLoc(0),
                },
            ])

            return [condition, body, WHILE]
        }
        case "RepeatStatement": {
            const REPEAT = newInstruction("REPEAT", [])
            const body = newInstruction("fPUSHCONT", [
                {
                    $: "Argument",
                    expression: {
                        $: "Code",
                        instructions: instr.instructions.flatMap(it => compileInstruction(ctx, it)),
                        loc: $.emptyLoc(0),
                    },
                    loc: $.emptyLoc(0),
                },
            ])

            return [body, REPEAT]
        }
        case "UntilStatement": {
            const UNTIL = newInstruction("UNTIL", [])
            const body = newInstruction("fPUSHCONT", [
                {
                    $: "Argument",
                    expression: {
                        $: "Code",
                        instructions: instr.instructions.flatMap(it => compileInstruction(ctx, it)),
                        loc: $.emptyLoc(0),
                    },
                    loc: $.emptyLoc(0),
                },
            ])

            return [body, UNTIL]
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
        case "FiftAddressNone":
            return {
                $: "Argument",
                expression: {
                    $: "DataLiteral",
                    value: {
                        $: "BinLiteral",
                        content: "00",
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
                        $: primitive.value.startsWith("0b")
                            ? "IntegerLiteralBin"
                            : primitive.value.startsWith("0x")
                              ? "IntegerLiteralHex"
                              : primitive.value.startsWith("0o")
                                ? "IntegerLiteralOct"
                                : "IntegerLiteralDec",
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
