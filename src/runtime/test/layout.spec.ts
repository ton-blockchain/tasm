import {compileCell, decompileCell} from "../index"
import {parse, print} from "../../text"
import {normalizeIndentation} from "./utils"

const test = (code: string, expected: string): (() => void) => {
    return () => {
        const res = parse("asm.tasm", normalizeIndentation(code))
        if (res.$ === "ParseFailure") {
            throw new Error(res.error.message)
        }
        const compiled = compileCell(res.instructions)
        const disasn = decompileCell(compiled)
        const disasnRes = print(disasn)
        const normalizedExpected = normalizeIndentation(expected)
        expect(disasnRes).toEqual(normalizedExpected)
    }
}

const PUSHSLICES = `PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                    PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                    PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}`

describe("tests auto layout", () => {
    it(
        "IF -> IFREF",
        test(
            `
                PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                PUSHCONT {
                    ${PUSHSLICES}
                }
                IF
            `,
            `
                PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                IFREF {
                    ${PUSHSLICES}
                }
            `,
        ),
    )
    it(
        "IFNOT -> IFNOTREF",
        test(
            `
                PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                PUSHCONT {
                    ${PUSHSLICES}
                }
                IFNOT
            `,
            `
                PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                IFNOTREF {
                    ${PUSHSLICES}
                }
            `,
        ),
    )
    it(
        "IFJMP -> IFJMPREF",
        test(
            `
                PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                PUSHCONT {
                    ${PUSHSLICES}
                }
                IFJMP
            `,
            `
                PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                IFJMPREF {
                    ${PUSHSLICES}
                }
            `,
        ),
    )
    it(
        "IFNOTJMP -> IFNOTJMPREF",
        test(
            `
                PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                PUSHCONT {
                    ${PUSHSLICES}
                }
                IFNOTJMP
            `,
            `
                PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                IFNOTJMPREF {
                    ${PUSHSLICES}
                }
            `,
        ),
    )
    it(
        "IFELSE -> IFELSEREF",
        test(
            `
                PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                PUSHCONT {
                    ADD
                }
                PUSHCONT {
                    ${PUSHSLICES}
                }
                IFELSE
            `,
            `
                PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                PUSHCONT {
                    ADD
                }
                IFELSEREF {
                    ${PUSHSLICES}
                }
            `,
        ),
    )

    it(
        "5 IF in row",
        test(
            `
                PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                PUSHCONT {
                    ${PUSHSLICES}
                }
                IF
                
                PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                PUSHCONT {
                    ${PUSHSLICES}
                }
                IF
                
                PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                PUSHCONT {
                    ${PUSHSLICES}
                }
                IF
                
                PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                PUSHCONT {
                    ${PUSHSLICES}
                }
                IF
                
                PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                PUSHCONT {
                    ${PUSHSLICES}
                }
                IF
            `,
            `
                PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                IFREF {
                    PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                    PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                    PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                }
                PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                IFREF {
                    PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                    PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                    PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                }
                PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                IFREF {
                    PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                    PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                    PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                }
                ref {
                    PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                    IFREF {
                        PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                        PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                        PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                    }
                    PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                    IFREF {
                        PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                        PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                        PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                    }
                }
            `,
        ),
    )
    it(
        "Too much references",
        test(
            `
                PUSHREF {}
                PUSHREF {}
                PUSHREF {}
                PUSHREF {}
                PUSHREF {}
                PUSHREF {}
                PUSHREF {}
            `,
            `
                PUSHREF {}
                PUSHREF {}
                PUSHREF {}
                ref {
                    PUSHREF {}
                    PUSHREF {}
                    PUSHREF {}
                    ref {
                        PUSHREF {}
                    }
                }
            `,
        ),
    )
})
