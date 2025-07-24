import type {Instr} from "../index"
import {
    compileCell,
    BBITS,
    NEWC,
    STSLICECONST,
    THROWANY,
    THROWARG,
    SETCP,
    PUSHINT_LONG,
    DICTIGETJMPZ,
    IFELSE,
    PUSHCONT_SHORT,
    THROW_SHORT,
    SDBEGINSX,
    SBITS,
    SDBEGINS,
    PUSHSLICE,
    DICTPUSHCONST,
    PUSHSLICE_LONG,
    decompileCell,
} from "../index"
import {beginCell, Cell} from "@ton/core"
import {compileFunc} from "@ton-community/func-js"
import {code, dictMap, hex} from "../util"
import {print} from "../../text"

const test =
    (instructions: Instr[], funcCode: string): (() => Promise<void>) =>
    async () => {
        const compiled = compileCell(instructions)
        const funcCompiled = await compile(funcCode)

        const actual = compiled.toString()
        const expected = funcCompiled[0].toString()

        if (actual !== expected) {
            const fift = funcCompiled[1]
            console.log(fift)

            const disasn = decompileCell(funcCompiled[0])
            console.log(print(disasn))

            const disasn2 = decompileCell(compiled)
            console.log(print(disasn2))
        }

        expect(actual).toEqual(expected)
    }

describe("tests", () => {
    it(
        "STSLICECONST",
        test(
            [
                SETCP(0),
                DICTPUSHCONST(
                    19,
                    dictMap(
                        new Map([
                            // prettier-ignore
                            [0, [
                            NEWC(),
                            STSLICECONST(beginCell().storeUint(0b0, 1).asSlice()),
                            STSLICECONST(beginCell().storeUint(0b0, 2).asSlice()),
                            STSLICECONST(beginCell().storeUint(0b0, 3).asSlice()),
                            STSLICECONST(beginCell().storeUint(0b0, 4).asSlice()),
                            STSLICECONST(beginCell().storeUint(0b0, 5).asSlice()),
                            STSLICECONST(beginCell().storeUint(0b0, 6).asSlice()),
                            STSLICECONST(beginCell().storeUint(0b0, 7).asSlice()),
                            STSLICECONST(beginCell().storeUint(0b0, 8).asSlice()),
                            STSLICECONST(beginCell().storeUint(0b0, 9).asSlice()),
                            BBITS(),
                            THROWANY(),
                        ]],
                        ]),
                    ),
                ),
                DICTIGETJMPZ(),
                THROWARG(11),
            ],
            `
            builder begin_cell() asm "NEWC";
            int builder_bits(builder b) asm "BBITS";

            builder store_slice1(builder b) asm "b{0} STSLICECONST";
            builder store_slice2(builder b) asm "b{00} STSLICECONST";
            builder store_slice3(builder b) asm "b{000} STSLICECONST";
            builder store_slice4(builder b) asm "b{0000} STSLICECONST";
            builder store_slice5(builder b) asm "b{00000} STSLICECONST";
            builder store_slice6(builder b) asm "b{000000} STSLICECONST";
            builder store_slice7(builder b) asm "b{0000000} STSLICECONST";
            builder store_slice8(builder b) asm "b{00000000} STSLICECONST";
            builder store_slice9(builder b) asm "b{000000000} STSLICECONST";
            
            () recv_internal() impure {
                throw(begin_cell()
                    .store_slice1()
                    .store_slice2()
                    .store_slice3()
                    .store_slice4()
                    .store_slice5()
                    .store_slice6()
                    .store_slice7()
                    .store_slice8()
                    .store_slice9()
                    .builder_bits());
        }`,
        ),
    )

    it(
        "PUSHINT_LONG",
        test(
            [
                SETCP(0),
                DICTPUSHCONST(
                    19,
                    dictMap(new Map([[0, [PUSHINT_LONG(99999999999999999n), THROWANY()]]])),
                ),
                DICTIGETJMPZ(),
                THROWARG(11),
            ],
            `
                () recv_internal() impure {
                    throw(99999999999999999);
                }`,
        ),
    )

    it(
        "IF-ELSE",
        test(
            [
                SETCP(0),
                DICTPUSHCONST(
                    19,
                    dictMap(
                        new Map([
                            // prettier-ignore
                            [0, [
                                PUSHCONT_SHORT(code([THROW_SHORT(1)])),
                                PUSHCONT_SHORT(code([THROW_SHORT(2)])),
                                IFELSE(),
                            ]],
                        ]),
                    ),
                ),
                DICTIGETJMPZ(),
                THROWARG(11),
            ],
            `
                () recv_internal(int cond) impure {
                    if (cond) {
                        throw(1);
                    } else {
                        throw(2);
                    }
                }`,
        ),
    )

    it(
        "SDBEGINSX",
        test(
            [
                SETCP(0),
                DICTPUSHCONST(19, dictMap(new Map([[0, [SDBEGINSX(), SBITS(), THROWANY()]]]))),
                DICTIGETJMPZ(),
                THROWARG(11),
            ],
            `
                slice sd_begins(slice where, slice to_find) asm "SDBEGINSX";
                int bits(slice where) asm "SBITS";
            
                () recv_internal(slice s1, slice s2) impure {
                    var s3 = sd_begins(s1, s2);
                    throw(bits(s3));
                }`,
        ),
    )

    it(
        "SDBEGINS",
        test(
            [
                SETCP(0),
                DICTPUSHCONST(
                    19,
                    dictMap(
                        new Map([
                            // prettier-ignore
                            [0, [
                                SDBEGINS(beginCell().storeUint(0n, 4).asSlice()), SBITS(), THROWANY(),
                            ]],
                        ]),
                    ),
                ),
                DICTIGETJMPZ(),
                THROWARG(11),
            ],
            `
                slice sd_begins(slice where) asm "b{0000} SDBEGINS";
                int bits(slice where) asm "SBITS";
            
                () recv_internal(slice s1) impure {
                    var s3 = sd_begins(s1);
                    throw(bits(s3));
                }`,
        ),
    )

    it(
        "PUSHINT_LONG",
        test(
            [
                SETCP(0),
                DICTPUSHCONST(
                    19,
                    dictMap(new Map([[0, [PUSHSLICE(hex("6_")), SBITS(), THROWANY()]]])),
                ),
                DICTIGETJMPZ(),
                THROWARG(11),
            ],
            `
                slice push_slice() asm "x{6_} PUSHSLICE";
                int bits(slice where) asm "SBITS";
            
                () recv_internal() impure {
                    throw(push_slice().bits());
                }`,
        ),
    )

    it(
        "PUSHSLICE_LONG",
        test(
            [
                SETCP(0),
                DICTPUSHCONST(
                    19,
                    dictMap(
                        new Map([
                            // prettier-ignore
                            [0, [
                                PUSHSLICE_LONG(
                                    hex(
                                        "BEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEF",
                                    ),
                                ),
                                SBITS(),
                                THROWANY(),
                            ]],
                        ]),
                    ),
                ),
                DICTIGETJMPZ(),
                THROWARG(11),
            ],
            `
                ;; 800 bits, too many for ordinary PUSHSLICE
                slice push_slice() asm "x{BEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEFBEEF} PUSHSLICE";
                int bits(slice where) asm "SBITS";
            
                () recv_internal() impure {
                    throw(push_slice().bits());
                }`,
        ),
    )
})

const compile = async (code: string): Promise<[Cell, string]> => {
    const res = await compileFunc({
        sources: [
            {
                content: code,
                filename: "source",
            },
        ],
    })
    if (res.status === "error") {
        throw new Error("cannot compile FunC")
    }

    return [Cell.fromBase64(res.codeBoc), res.fiftCode]
}
