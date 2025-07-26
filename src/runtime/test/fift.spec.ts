import type {Instr} from "../index"
import {fPUSHCONT, fSTSLICECONST, NOP, PUSHSLICE_LONG} from "../index"
import {fPUSHSLICE} from "../index"
import {compileCell, decompileCell, fPUSHINT, fPUSH, fPOP} from "../index"
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
