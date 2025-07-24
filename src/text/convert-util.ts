import * as $ from "./util"
import type {$ast} from "./grammar"
import type {Loc} from "../runtime/util"

export const assertZeroArgs = (instr: $ast.Instruction, loc: Loc) => {
    const argsLen = instr.args
    if (argsLen.length > 0) {
        throw new $.ParseError(loc, "Expected 0 arguments")
    }
}

export const assertSingleArgs = (instr: $ast.Instruction, loc: Loc) => {
    const argsLen = instr.args
    if (argsLen.length !== 1) {
        throw new $.ParseError(loc, "Expected 1 argument")
    }
}
