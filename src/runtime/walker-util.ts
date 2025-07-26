import type * as c from "./index"
import type {InstructionArg} from "./walker"
import {walkInstructionArgs} from "./walker"

export type WalkerCallback = (
    instr: c.Instr,
    arg: InstructionArg,
    argName: string,
    argIndex: number,
) => void

export function walk(instr: c.Instr, callback: WalkerCallback): void {
    walkInstructionArgs(instr, (instr, arg, argName, argIndex) => {
        callback(instr, arg, argName, argIndex)

        if (arg.$ === "code") {
            walkCode(arg.value, callback)
        }
        if (arg.$ === "dictpush") {
            walkDict(arg.value, callback)
        }
    })
}

export function walkCode(code: c.util.Code, callback: WalkerCallback): void {
    if (code.$ === "Raw") return

    for (const instruction of code.instructions) {
        walkInstructionArgs(instruction, (instr, arg, argName, argIndex) => {
            callback(instr, arg, argName, argIndex)

            if (arg.$ === "code") {
                walkCode(arg.value, callback)
            }

            if (arg.$ === "dictpush") {
                walkDict(arg.value, callback)
            }
        })
    }
}

export function walkDict(dict: c.util.Dict, callback: WalkerCallback): void {
    if (dict.$ === "RawDict") return

    for (const method of dict.methods) {
        walkCode(
            {
                $: "Instructions",
                instructions: method.instructions,
            },
            callback,
        )
    }
}
