import * as c from "./constructors"
import * as t from "./types"
import type {Instr} from "./instr-gen"
import type * as $ from "./util"

type RefRewriteRule = {
    instrName: string
    ctor: (arg0: $.Code, loc?: $.Loc) => Instr
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type: $.Type<any>
}

const matchRefRule = (rule: RefRewriteRule, instructions: Instr[]): {body: $.Code} | undefined => {
    const [first, second] = instructions
    const match = first?.$ === "PUSHCONT" && second?.$ === rule.instrName
    if (!match) return undefined
    return {body: first.arg0}
}

const rules: RefRewriteRule[] = [
    {
        instrName: "IF",
        ctor: c.IFREF,
        type: t.IFREF,
    },
    {
        instrName: "IFNOT",
        ctor: c.IFNOTREF,
        type: t.IFNOTREF,
    },
    {
        instrName: "IFJMP",
        ctor: c.IFJMPREF,
        type: t.IFJMPREF,
    },
    {
        instrName: "IFNOTJMP",
        ctor: c.IFNOTJMPREF,
        type: t.IFNOTJMPREF,
    },
    {
        instrName: "IFELSE",
        ctor: c.IFELSEREF,
        type: t.IFELSEREF,
    },
]

export const matchingRule = (
    instructions: Instr[],
): {body: $.Code; rule: RefRewriteRule} | undefined => {
    for (const rule of rules) {
        const match = matchRefRule(rule, instructions)
        if (match) {
            return {
                body: match.body,
                rule,
            }
        }
    }
    return undefined
}
