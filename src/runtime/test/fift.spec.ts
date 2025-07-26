import type {Instr} from "../index"
import {
    fPUSHCONT,
    fSTSLICECONST,
    NOP,
    PUSHSLICE_LONG,
    fPUSHSLICE,
    fPUSHINT,
    fPUSH,
    fPOP,
    fXCHG,
    fPUSHINTX,
    fSDBEGINS,
    fSDBEGINSQ,
    fCALLXARGS,
    fCALLDICT,
    fJMPDICT,
    fPREPAREDICT,
    fTHROW,
    fTHROWIF,
    fTHROWIFNOT,
    compileCell,
    decompileCell,
} from "../index"
import {print} from "../../text"
import {normalizeIndentation} from "./utils"
import {beginCell, Cell} from "@ton/core"
import {code} from "../util"

const test =
    (instructions: Instr[], asmCode: string): (() => void) =>
    () => {
        const compiled = compileCell(instructions)
        const disasn = decompileCell(compiled)
        expect(print(disasn)).toEqual(normalizeIndentation(asmCode))
    }

describe("Test PUSHINT Fift instruction", () => {
    describe("PUSHINT_4", () => {
        it(
            "with 1",
            test(
                [fPUSHINT(1n)],
                `
                PUSHINT_4 1
            `,
            ),
        )
        it(
            "with -5",
            test(
                [fPUSHINT(-5n)],
                `
                PUSHINT_4 -5
            `,
            ),
        )
        it(
            "with 10",
            test(
                [fPUSHINT(10n)],
                `
                PUSHINT_4 10
            `,
            ),
        )
    })

    describe("PUSHINT_8", () => {
        it(
            "with 11",
            test(
                [fPUSHINT(11n)],
                `
                    PUSHINT_8 11
                `,
            ),
        )
        it(
            "with 56",
            test(
                [fPUSHINT(56n)],
                `
                    PUSHINT_8 56
                `,
            ),
        )
        it(
            "with -128",
            test(
                [fPUSHINT(-128n)],
                `
                    PUSHINT_8 -128
                `,
            ),
        )
        it(
            "with 127",
            test(
                [fPUSHINT(127n)],
                `
                    PUSHINT_8 127
                `,
            ),
        )
    })

    describe("PUSHINT_16", () => {
        it(
            "with 128",
            test(
                [fPUSHINT(128n)],
                `
                    PUSHINT_16 128
                `,
            ),
        )
        it(
            "with -129",
            test(
                [fPUSHINT(-129n)],
                `
                    PUSHINT_16 -129
                `,
            ),
        )
        it(
            "with 32767",
            test(
                [fPUSHINT(32767n)],
                `
                    PUSHINT_16 32767
                `,
            ),
        )
        it(
            "with -32768",
            test(
                [fPUSHINT(-32768n)],
                `
                    PUSHINT_16 -32768
                `,
            ),
        )
    })

    describe("PUSHINT_LONG", () => {
        it(
            "with 32768",
            test(
                [fPUSHINT(32769n)],
                `
                    PUSHINT_LONG 32769
                `,
            ),
        )
        it(
            "with -32769",
            test(
                [fPUSHINT(-32769n)],
                `
                    PUSHINT_LONG -32769
                `,
            ),
        )
        it(
            "with 99999999999999999",
            test(
                [fPUSHINT(99999999999999999n)],
                `
                    PUSHINT_LONG 99999999999999999
                `,
            ),
        )
        it(
            "with -99999999999999999",
            test(
                [fPUSHINT(-99999999999999999n)],
                `
                    PUSHINT_LONG -99999999999999999
                `,
            ),
        )
    })
})

describe("Test PUSH Fift instruction", () => {
    describe("PUSH s", () => {
        it(
            "with s2",
            test(
                [fPUSH("stack", 2)],
                `
                    PUSH s2
                `,
            ),
        )
        it(
            "with s15",
            test(
                [fPUSH("stack", 15)],
                `
                    PUSH s15
                `,
            ),
        )
        it(
            "with s16",
            test(
                [fPUSH("stack", 16)],
                `
                    PUSH_LONG s16
                `,
            ),
        )
        it(
            "with s99",
            test(
                [fPUSH("stack", 99)],
                `
                    PUSH_LONG s99
                `,
            ),
        )
    })

    describe("PUSH c", () => {
        it(
            "with c1",
            test(
                [fPUSH("control", 1)],
                `
                    PUSHCTR c1
                `,
            ),
        )
        it(
            "with c7",
            test(
                [fPUSH("control", 7)],
                `
                    PUSHCTR c7
                `,
            ),
        )
    })
})

describe("Test POP Fift instruction", () => {
    describe("POP s", () => {
        it(
            "with s2",
            test(
                [fPOP("stack", 2)],
                `
                    POP s2
                `,
            ),
        )
        it(
            "with s15",
            test(
                [fPOP("stack", 15)],
                `
                    POP s15
                `,
            ),
        )
        it(
            "with s16",
            test(
                [fPOP("stack", 16)],
                `
                    POP_LONG s16
                `,
            ),
        )
        it(
            "with s99",
            test(
                [fPOP("stack", 99)],
                `
                    POP_LONG s99
                `,
            ),
        )
    })

    describe("POP c", () => {
        it(
            "with c1",
            test(
                [fPOP("control", 1)],
                `
                    POPCTR c1
                `,
            ),
        )
        it(
            "with c7",
            test(
                [fPOP("control", 7)],
                `
                    POPCTR c7
                `,
            ),
        )
    })
})

describe("Test PUSHSLICE Fift instruction", () => {
    it(
        "with no references and body bits < 63",
        test(
            [fPUSHSLICE(beginCell().storeUint(1, 32).asSlice())],
            `
                PUSHSLICE x{00000001}
            `,
        ),
    )
    it(
        "with no references and body bits = 123",
        test(
            [fPUSHSLICE(beginCell().storeUint(1, 123).asSlice())],
            `
                PUSHSLICE x{0000000000000000000000000000003_}
            `,
        ),
    )
    it(
        "with no references and body bits = 124",
        test(
            [fPUSHSLICE(beginCell().storeUint(1, 124).asSlice())],
            `
                PUSHSLICE_LONG x{0000000000000000000000000000001}
            `,
        ),
    )
    it(
        "with 1 reference and body bits = 124",
        test(
            [fPUSHSLICE(beginCell().storeUint(1, 124).storeRef(beginCell().endCell()).asSlice())],
            `
                PUSHSLICE_REFS boc{b5ee9c7241010201001500011f00000000000000000000000000000018010000dea8107d}
            `,
        ),
    )
    it(
        "with 1 reference and body bits = 256",
        test(
            [fPUSHSLICE(beginCell().storeUint(1, 256).storeRef(beginCell().endCell()).asSlice())],
            `
                PUSHSLICE_LONG boc{b5ee9c724101020100250001400000000000000000000000000000000000000000000000000000000000000001010000b7126e18}
            `,
        ),
    )

    // it("should aaa", () => {
    //     // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    //     console.log(print(decompileCell(Cell.fromBoc(readFileSync("out.boc"))[0]!)))
    // })
})

describe("Test fPUSHCONT Fift instruction", () => {
    it(
        "with no references and body bits < 120",
        test(
            [fPUSHCONT(code([NOP()]))],
            `
                PUSHCONT_SHORT {
                    NOP
                }
            `,
        ),
    )
    it(
        "with no references and body bits = 121",
        test(
            [
                fPUSHCONT(
                    code([
                        NOP(),
                        NOP(),
                        NOP(),
                        NOP(),
                        NOP(),
                        NOP(),
                        NOP(),
                        NOP(),
                        NOP(),
                        NOP(),
                        NOP(),
                        NOP(),
                        NOP(),
                        NOP(),
                    ]),
                ),
            ],
            `
                PUSHCONT {
                    NOP
                    NOP
                    NOP
                    NOP
                    NOP
                    NOP
                    NOP
                    NOP
                    NOP
                    NOP
                    NOP
                    NOP
                    NOP
                    NOP
                }
            `,
        ),
    )
    it(
        "with no references, but doesn't fit in current cell",
        test(
            [
                PUSHSLICE_LONG(
                    beginCell()
                        .storeUint(1, 256)
                        .storeUint(1, 256)
                        .storeUint(1, 256)
                        .storeUint(1, 212)
                        .asSlice(), // 980 bits
                ),
                fPUSHCONT(code([NOP(), NOP(), NOP(), NOP()])),
            ],
            `
                PUSHSLICE_LONG x{00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000001}
                PUSHREFCONT {
                    NOP
                    NOP
                    NOP
                    NOP
                }
            `,
        ),
    )
})

describe("Test STSLICECONST Fift instruction", () => {
    it(
        "with no references and body bits < 57",
        test(
            [fSTSLICECONST(beginCell().storeUint(1, 32).asSlice())],
            `
                STSLICECONST x{00000001}
            `,
        ),
    )
    it(
        "with no references and body bits > 57",
        test(
            [fSTSLICECONST(beginCell().storeUint(1, 58).asSlice())],
            `
                PUSHSLICE x{000000000000006_}
                STSLICER
            `,
        ),
    )
    it(
        "with no references and body bits = 200",
        test(
            [fSTSLICECONST(beginCell().storeUint(1, 200).asSlice())],
            `
                PUSHSLICE_LONG x{00000000000000000000000000000000000000000000000001}
                STSLICER
            `,
        ),
    )
    it(
        "with 4 references and body bits = 200",
        test(
            [
                fSTSLICECONST(
                    beginCell()
                        .storeUint(1, 200)
                        .storeRef(new Cell())
                        .storeRef(new Cell())
                        .storeRef(new Cell())
                        .storeRef(new Cell())
                        .asSlice(),
                ),
            ],
            `
                PUSHSLICE_LONG boc{b5ee9c7241010201002100043200000000000000000000000000000000000000000000000001010101010000a0af672e}
                STSLICER
            `,
        ),
    )
})

describe("Test XCHG Fift instruction", () => {
    it(
        "with s1, s2 -> XCHG_IJ",
        test(
            [fXCHG(1, 2)],
            `
                XCHG_IJ s1 s2
            `,
        ),
    )
    it(
        "with s0, s5 -> XCHG_0I",
        test(
            [fXCHG(0, 5)],
            `
                XCHG_0I s5
            `,
        ),
    )
    it(
        "with s0, s16 -> XCHG_01_LONG",
        test(
            [fXCHG(0, 16)],
            `
                XCHG_01_LONG s16
            `,
        ),
    )
    it(
        "with large indices -> triple XCHG_01_LONG sequence",
        test(
            [fXCHG(5, 20)],
            `
                XCHG_01_LONG s5
                XCHG_01_LONG s20
                XCHG_01_LONG s5
            `,
        ),
    )
    it("with same indices -> NOP (empty)", test([fXCHG(5, 5)], ""))
})

describe("Test PUSHINTX Fift instruction", () => {
    it(
        "with small value -> PUSHINT_4",
        test(
            [fPUSHINTX(5n)],
            `
                PUSHINT_4 5
            `,
        ),
    )
    it(
        "with power of 2 -> PUSHPOW2",
        test(
            [fPUSHINTX(16n)],
            `
                PUSHPOW2 4
            `,
        ),
    )
    it(
        "with 2^n - 1 -> PUSHPOW2DEC",
        test(
            [fPUSHINTX(15n)],
            `
                PUSHPOW2DEC 4
            `,
        ),
    )
    it(
        "with negative power of 2 -> PUSHNEGPOW2",
        test(
            [fPUSHINTX(-16n)],
            `
                PUSHNEGPOW2 4
            `,
        ),
    )
    it(
        "with large power of 2 -> PUSHINT + LSHIFT",
        test(
            [fPUSHINTX(100663296n)], // 3 * 2^25
            `
                PUSHINT_4 3
                LSHIFT 25
            `,
        ),
    )
    it("should throw for 256", () => {
        expect(() => compileCell([fPUSHINTX(256n)])).toThrow("use PUSHNAN instead of 256 PUSHPOW2")
    })
})

describe("Test SDBEGINS Fift instruction", () => {
    it(
        "with slice without references -> SDBEGINS",
        test(
            [fSDBEGINS(beginCell().storeUint(1, 32).asSlice())],
            `
                SDBEGINS x{00000001}
            `,
        ),
    )

    it("should throw with references", () => {
        expect(() =>
            compileCell([
                fSDBEGINS(beginCell().storeUint(1, 32).storeRef(beginCell().endCell()).asSlice()),
            ]),
        ).toThrow("no references allowed in slice")
    })
})

describe("Test SDBEGINSQ Fift instruction", () => {
    it(
        "with slice without references -> SDBEGINSQ",
        test(
            [fSDBEGINSQ(beginCell().storeUint(1, 32).asSlice())],
            `
                SDBEGINSQ x{00000001}
            `,
        ),
    )

    it("should throw with references", () => {
        expect(() =>
            compileCell([
                fSDBEGINSQ(beginCell().storeUint(1, 32).storeRef(beginCell().endCell()).asSlice()),
            ]),
        ).toThrow("no references allowed in slice")
    })
})

describe("Test CALLXARGS Fift instruction", () => {
    it(
        "with -1 -> CALLXARGS",
        test(
            [fCALLXARGS(2, -1)],
            `
                CALLXARGS 2 -1
            `,
        ),
    )
    it(
        "with other value -> CALLXARGS_1",
        test(
            [fCALLXARGS(2, 3)],
            `
                CALLXARGS_1 2 3
            `,
        ),
    )
})

describe("Test CALLDICT Fift instruction", () => {
    it(
        "with small value -> CALLDICT",
        test(
            [fCALLDICT(42)],
            `
                CALLDICT 42
            `,
        ),
    )
    it(
        "with large value -> CALLDICT_LONG",
        test(
            [fCALLDICT(1000)],
            `
                CALLDICT_LONG 1000
            `,
        ),
    )
    it(
        "with very large value -> fallback to PUSHINT + c3 PUSH + EXECUTE",
        test(
            [fCALLDICT(20000)],
            `
                PUSHINT_16 20000
                PUSHCTR c3
                EXECUTE
            `,
        ),
    )
})

describe("Test JMPDICT Fift instruction", () => {
    it(
        "with valid value -> JMPDICT",
        test(
            [fJMPDICT(123)],
            `
                JMPDICT 123
            `,
        ),
    )
    it(
        "with very large value -> fallback to PUSHINT + c3 PUSH + JMPX",
        test(
            [fJMPDICT(20000)],
            `
                PUSHINT_16 20000
                PUSHCTR c3
                JMPX
            `,
        ),
    )
})

describe("Test PREPAREDICT Fift instruction", () => {
    it(
        "with valid value -> PREPAREDICT",
        test(
            [fPREPAREDICT(456)],
            `
                PREPAREDICT 456
            `,
        ),
    )
    it(
        "with very large value -> fallback to PUSHINT + c3 PUSH",
        test(
            [fPREPAREDICT(20000)],
            `
                PUSHINT_16 20000
                PUSHCTR c3
            `,
        ),
    )
})

describe("Test THROW Fift instruction", () => {
    it(
        "with small value -> THROW_SHORT",
        test(
            [fTHROW(42)],
            `
                THROW_SHORT 42
            `,
        ),
    )
    it(
        "with large value -> THROW",
        test(
            [fTHROW(1000)],
            `
                THROW 1000
            `,
        ),
    )
    it("should throw for out of range", () => {
        expect(() => compileCell([fTHROW(2048)])).toThrow("THROW argument out of range")
    })
})

describe("Test THROWIF Fift instruction", () => {
    it(
        "with small value -> THROWIF_SHORT",
        test(
            [fTHROWIF(35)],
            `
                THROWIF_SHORT 35
            `,
        ),
    )
    it(
        "with large value -> THROWIF",
        test(
            [fTHROWIF(500)],
            `
                THROWIF 500
            `,
        ),
    )
    it("should throw for out of range", () => {
        expect(() => compileCell([fTHROWIF(2048)])).toThrow("THROWIF argument out of range")
    })
})

describe("Test THROWIFNOT Fift instruction", () => {
    it(
        "with small value -> THROWIFNOT_SHORT",
        test(
            [fTHROWIFNOT(20)],
            `
                THROWIFNOT_SHORT 20
            `,
        ),
    )
    it(
        "with large value -> THROWIFNOT",
        test(
            [fTHROWIFNOT(800)],
            `
                THROWIFNOT 800
            `,
        ),
    )
    it("should throw for out of range", () => {
        expect(() => compileCell([fTHROWIFNOT(2048)])).toThrow("THROWIFNOT argument out of range")
    })
})
