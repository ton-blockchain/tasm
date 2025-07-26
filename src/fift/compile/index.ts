import {parse} from "../parse/parse"
import {$ast} from "../parse/grammar"
import type {$ast as $astT} from "../../text/grammar"
import * as $ from "@tonstudio/parser-runtime"
import {type Ctx, print, processInstructions} from "../../text"
import Instruction = $ast.Instruction

// eslint-disable-next-line @typescript-eslint/require-await
const main = async () => {
    const code = `
    "Asm.fif" include
    // automatically generated from 1.tolk
    PROGRAM{
      0 DECLMETHOD onInternalMessage()
      onInternalMessage() PROC:<{
        11 PUSHINT
        INMSG_BOUNCED
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
        3 THROW
      }>
    }END>c
    `
    const result = parse("test.fift", code)

    if (result.$ === "ParseFailure") {
        throw result.error
    }

    console.log(result.ast)

    for (const def of result.ast.program.definitions) {
        const instructions = def.def.instructions.flatMap(it => compileInstruction(it))
        console.log(instructions)

        const ctx: Ctx = {lines: [], filepath: ""}
        const instrs = processInstructions(ctx, instructions)

        console.log(print(instrs))
    }
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

function compileInstruction(raw: Instruction): $astT.Instruction[] {
    const instr = raw.instr
    switch (instr.$) {
        case "AsmExpression": {
            const args = instr.arguments?.primitives.map(it => convertPrimitive(it)) ?? []

            if (
                instr.name.value === "PUSHINT" ||
                instr.name.value === "PUSH" ||
                instr.name.value === "POP" ||
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
            throw new Error('Not implemented yet: "IfStatement" case')
        }
        case "IfjmpStatement": {
            const IFJMP: $astT.Instruction = {
                $: "Instruction",
                name: {
                    $: "Id",
                    name: "IFJMP",
                    loc: $.emptyLoc(0),
                },
                args: [],
                loc: $.emptyLoc(0),
            }
            const PUSHCONT: $astT.Instruction = {
                $: "Instruction",
                name: {
                    $: "Id",
                    name: "PUSHCONT",
                    loc: $.emptyLoc(0),
                },
                args: [
                    {
                        $: "Argument",
                        expression: {
                            $: "Code",
                            instructions: instr.instructions.flatMap(it => compileInstruction(it)),
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
            throw new Error('Not implemented yet: "WhileStatement" case')
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

function convertPrimitive(raw: $ast.AsmPrimitive): $astT.Argument {
    const primitive = raw.prim
    switch (primitive.$) {
        case "InstructionBlock":
            return {
                $: "Argument",
                expression: {
                    $: "Code",
                    instructions: primitive.instructions.flatMap(it => compileInstruction(it)),
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
            throw new Error("Not implemented yet: ArgIdentifier")
    }

    throw new Error("Unexpected error")
}

void main()
