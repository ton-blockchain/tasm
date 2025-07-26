import type {Instr} from "../index"
import {compileCell, decompileCell} from "../index"
import {print} from "../../text"
import {fPUSHINT} from "../fift-instr-constructors"
import {normalizeIndentation} from "./utils"

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
