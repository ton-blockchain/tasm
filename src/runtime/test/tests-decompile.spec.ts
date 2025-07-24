import type {Instr} from "../index"
import {
    compileCell,
    THROWARG,
    SETCP,
    DICTIGETJMPZ,
    DICTPUSHCONST,
    IFBITJMPREF,
    PUSHINT_4,
    ADD,
    IFNBITJMPREF,
    MUL,
    PUSHSLICE,
    PUSHSLICE_LONG,
    DEBUGSTR,
    PUSHINT_LONG,
    decompileCell,
    NEWC,
    STREFCONST,
    ENDC,
    STREF2CONST,
    SUB,
} from "../index"
import {call, execute} from "../../helpers"
import {bin, code, dictMap, hex} from "../util"
import {print} from "../../text"

const someFunction = (): Instr[] => [MUL(), ADD()]

const test = (instructions: Instr[], expected: string): (() => void) => {
    return () => {
        const compiled = compileCell(instructions)
        const disasn = decompileCell(compiled)
        const disasnRes = print(disasn)
        expect(disasnRes).toEqual(expected)
    }
}

const testFail = (instructions: Instr[], expected: string): (() => void) => {
    return () => {
        expect(() => compileCell(instructions)).toThrow(expected)
    }
}

describe("tests with decompiled", () => {
    it(
        "with IFBITJMPREF",
        test(
            [
                SETCP(0),
                DICTPUSHCONST(
                    19,
                    dictMap(
                        new Map([[0, [IFBITJMPREF(2, code([PUSHINT_4(1), PUSHINT_4(1), ADD()]))]]]),
                    ),
                ),
                DICTIGETJMPZ(),
                THROWARG(11),
            ],
            `SETCP 0
DICTPUSHCONST 19 [
    0 => {
        IFBITJMPREF 2 {
            PUSHINT_4 1
            PUSHINT_4 1
            ADD
        }
    }
]
DICTIGETJMPZ
THROWARG 11
`,
        ),
    )

    it(
        "with IFNBITJMPREF",
        test(
            [
                SETCP(0),
                DICTPUSHCONST(
                    19,
                    dictMap(
                        new Map([
                            [0, [IFNBITJMPREF(2, code([PUSHINT_4(1), PUSHINT_4(2), ADD()]))]],
                        ]),
                    ),
                ),
                DICTIGETJMPZ(),
                THROWARG(11),
            ],
            `SETCP 0
DICTPUSHCONST 19 [
    0 => {
        IFNBITJMPREF 2 {
            PUSHINT_4 1
            PUSHINT_4 2
            ADD
        }
    }
]
DICTIGETJMPZ
THROWARG 11
`,
        ),
    )

    it(
        "with call helper",
        test(
            [
                SETCP(0),
                DICTPUSHCONST(
                    19,
                    dictMap(new Map([[0, [...call(ADD(), PUSHINT_4(1), PUSHINT_4(2))]]])),
                ),
                DICTIGETJMPZ(),
                THROWARG(11),
            ],
            `SETCP 0
DICTPUSHCONST 19 [
    0 => {
        PUSHINT_4 1
        PUSHINT_4 2
        ADD
    }
]
DICTIGETJMPZ
THROWARG 11
`,
        ),
    )

    it(
        "with execute helper",
        test(
            [
                SETCP(0),
                DICTPUSHCONST(
                    19,
                    dictMap(
                        new Map([
                            [
                                0,
                                [
                                    ...execute(
                                        someFunction,
                                        PUSHINT_4(1),
                                        PUSHINT_4(2),
                                        PUSHINT_4(3),
                                    ),
                                ],
                            ],
                        ]),
                    ),
                ),
                DICTIGETJMPZ(),
                THROWARG(11),
            ],
            `SETCP 0
DICTPUSHCONST 19 [
    0 => {
        PUSHINT_4 1
        PUSHINT_4 2
        PUSHINT_4 3
        PUSHCONT {
            MUL
            ADD
        }
        EXECUTE
    }
]
DICTIGETJMPZ
THROWARG 11
`,
        ),
    )

    it(
        "with PUSHSLICE",
        test(
            [
                SETCP(0),
                DICTPUSHCONST(19, dictMap(new Map([[0, [PUSHSLICE(hex("6_"))]]]))),
                DICTIGETJMPZ(),
                THROWARG(11),
            ],
            `SETCP 0
DICTPUSHCONST 19 [
    0 => {
        PUSHSLICE x{6_}
    }
]
DICTIGETJMPZ
THROWARG 11
`,
        ),
    )

    it(
        "with PUSHSLICE_LONG",
        test(
            [
                SETCP(0),
                DICTPUSHCONST(19, dictMap(new Map([[0, [PUSHSLICE_LONG(hex("6_"))]]]))),
                DICTIGETJMPZ(),
                THROWARG(11),
            ],
            `SETCP 0
DICTPUSHCONST 19 [
    0 => {
        PUSHSLICE_LONG x{6_}
    }
]
DICTIGETJMPZ
THROWARG 11
`,
        ),
    )

    it(
        "with DEBUGSTR",
        test(
            [
                SETCP(0),
                DICTPUSHCONST(
                    19,
                    dictMap(
                        new Map([
                            [
                                0,
                                [
                                    DEBUGSTR(hex("016D61696E5F65787465726E616C")),
                                    DEBUGSTR(hex("01636865636B5369676E")),
                                    DEBUGSTR(hex("01636865636B5369676E32")),
                                    DEBUGSTR(hex("01636865636B5369676E33")),
                                    DEBUGSTR(hex("017265706C61795F70726F74")),
                                    DEBUGSTR(hex("017265706C61795F70726F74")),
                                    DEBUGSTR(hex("017265706C61795F70726F7432")),
                                ],
                            ],
                        ]),
                    ),
                ),
                DICTIGETJMPZ(),
                THROWARG(11),
            ],
            `SETCP 0
DICTPUSHCONST 19 [
    0 => {
        DEBUGSTR x{016D61696E5F65787465726E616C}
        DEBUGSTR x{01636865636B5369676E}
        DEBUGSTR x{01636865636B5369676E32}
        DEBUGSTR x{01636865636B5369676E33}
        DEBUGSTR x{017265706C61795F70726F74}
        DEBUGSTR x{017265706C61795F70726F74}
        DEBUGSTR x{017265706C61795F70726F7432}
    }
]
DICTIGETJMPZ
THROWARG 11
`,
        ),
    )

    it(
        "with PUSHINT_LONG 130",
        test(
            [
                SETCP(0),
                DICTPUSHCONST(19, dictMap(new Map([[0, [PUSHINT_LONG(130n)]]]))),
                DICTIGETJMPZ(),
                THROWARG(11),
            ],
            `SETCP 0
DICTPUSHCONST 19 [
    0 => {
        PUSHINT_LONG 130
    }
]
DICTIGETJMPZ
THROWARG 11
`,
        ),
    )

    it(
        "with STREFCONST",
        test(
            [SETCP(0), NEWC(), STREFCONST(code([PUSHINT_4(5), PUSHINT_4(6), ADD()])), ENDC()],
            `SETCP 0
NEWC
STREFCONST {
    PUSHINT_4 5
    PUSHINT_4 6
    ADD
}
ENDC
`,
        ),
    )

    it(
        "with STREF2CONST",
        test(
            [
                SETCP(0),
                NEWC(),
                STREF2CONST(
                    code([PUSHINT_4(5), PUSHINT_4(6), ADD()]),
                    code([PUSHINT_4(6), PUSHINT_4(7), SUB()]),
                ),
                ENDC(),
            ],
            `SETCP 0
NEWC
STREF2CONST {
    PUSHINT_4 5
    PUSHINT_4 6
    ADD
} {
    PUSHINT_4 6
    PUSHINT_4 7
    SUB
}
ENDC
`,
        ),
    )
    it(
        "with short DEBUGSTR",
        testFail(
            [DEBUGSTR(bin("00001"))],
            `DEBUGSTR slice should be larger that 8 bits, but 5-bit slice given`,
        ),
    )
    it(
        "with 8-bit DEBUGSTR",
        test(
            [DEBUGSTR(bin("00000001"))],
            `DEBUGSTR x{01}
`,
        ),
    )
    it(
        "with 9-bit DEBUGSTR",
        testFail(
            [DEBUGSTR(bin("000000001"))],
            `DEBUGSTR slice should be byte aligned, but 9-bit slice given`,
        ),
    )
})
