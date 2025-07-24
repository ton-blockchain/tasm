import {compileCell, decompileCell} from "../index"
import {Cell} from "@ton/core"
import {parse, print} from "../../text"
import {runTolkCompiler} from "@ton/tolk-js"

const test =
    (tolkCode: string, expectedAssembly: string): (() => Promise<void>) =>
    async () => {
        const res = parse("code.tasm", expectedAssembly)
        if (res.$ === "ParseFailure") {
            throw res.error
        }
        const compiled = compileCell(res.instructions)
        const tolkCompiled = await compile(tolkCode)

        const expectedCompiledAssembly = compiled.toString()
        const actualCompiledTolk = tolkCompiled[0].toString()

        if (expectedCompiledAssembly !== actualCompiledTolk) {
            const fift = tolkCompiled[1]
            console.log(fift)

            const disasn = decompileCell(tolkCompiled[0])
            console.log(print(disasn))

            const disasn2 = decompileCell(compiled)
            console.log(print(disasn2))
        }

        expect(expectedCompiledAssembly).toEqual(actualCompiledTolk)
    }

describe("TVM11 opcodes", () => {
    it(
        "INMSG_BOUNCED in real world Tolk code",
        test(
            `
                struct (0x7e8764ef) IncreaseCounter {
                    queryId: uint64
                    increaseBy: uint32
                }
                
                struct (0x3a752f06) ResetCounter {
                    queryId: uint64
                }
            
                type AllowedMessage = IncreaseCounter | ResetCounter
            
                fun onInternalMessage(in: InMessage) {
                    val msg = lazy AllowedMessage.fromSlice(in.body);
                    
                    match (msg) {
                        IncreaseCounter => {}
                        ResetCounter => {}
                        else => {
                            assert (in.body.isEmpty()) throw 0xFFFF;
                        }
                    }
                }
            `,
            `
                SETCP 0
                DICTPUSHCONST 19 [
                    0 => {
                        INMSG_BOUNCED
                        THROWIF_SHORT 0
                        DUP
                        SDBEGINSQ x{7E8764EF}
                        PUSHCONT_SHORT {
                            DROP2
                        }
                        IFJMP
                        SDBEGINSQ x{3A752F06}
                        NIP
                        PUSHCONT_SHORT {
                            DROP
                        }
                        IFJMP
                        PUSHPOW2DEC 16
                        SWAP
                        SEMPTY
                        THROWANYIFNOT
                    }
                ]
                DICTIGETJMPZ
                THROWARG 11
            `,
        ),
    )

    it(
        "INMSG_SRC in real world Tolk code",
        test(
            `
                struct (0x7e8764ef) IncreaseCounter {
                    queryId: uint64
                    increaseBy: uint32
                }
                
                struct (0x3a752f06) ResetCounter {
                    queryId: uint64
                }
            
                type AllowedMessage = IncreaseCounter | ResetCounter
            
                fun onInternalMessage(in: InMessage) {
                    val msg = lazy AllowedMessage.fromSlice(in.body);
                    
                    match (msg) {
                        IncreaseCounter => {
                            if (in.senderAddress.isNone()) {
                                throw 10;
                            }
                        }
                        ResetCounter => {}
                        else => {
                            // ignore empty messages, "wrong opcode" for others
                            assert (in.body.isEmpty()) throw 0xFFFF;
                        }
                    }
                }
            `,
            `
                SETCP 0
                DICTPUSHCONST 19 [
                    0 => {
                        INMSG_BOUNCED
                        THROWIF_SHORT 0
                        DUP
                        SDBEGINSQ x{7E8764EF}
                        PUSHCONT_SHORT {
                            DROP2
                            INMSG_SRC
                            SDBEGINSQ x{2_}
                            NIP
                            PUSHCONT_SHORT {
                                THROW_SHORT 10
                            }
                            IFJMP
                        }
                        IFJMP
                        SDBEGINSQ x{3A752F06}
                        NIP
                        PUSHCONT_SHORT {
                            DROP
                        }
                        IFJMP
                        PUSHPOW2DEC 16
                        SWAP
                        SEMPTY
                        THROWANYIFNOT
                    }
                ]
                DICTIGETJMPZ
                THROWARG 11
            `,
        ),
    )
    it(
        "INMSG_BOUNCED, INMSG_UTIME, INMSG_LT, INMSG_FWDFEE, INMSG_SRC, INMSG_VALUE, INMSG_VALUEEXTRA in Tolk code",
        test(
            `
                fun onInternalMessage(in: InMessage) {
                    debug.print(in.body);
                    debug.print(in.createdAt);
                    debug.print(in.createdLt);
                    debug.print(in.originalForwardFee);
                    debug.print(in.senderAddress);
                    debug.print(in.valueCoins);
                    debug.print(in.valueExtra);
                }
            `,
            `
                SETCP 0
                DICTPUSHCONST 19 [
                    0 => {
                        INMSG_BOUNCED
                        THROWIF_SHORT 0
                        DUMP s0
                        DROP
                        INMSG_UTIME
                        DUMP s0
                        DROP
                        INMSG_LT
                        DUMP s0
                        DROP
                        INMSG_FWDFEE
                        PUSHINT_4 0
                        GETORIGINALFWDFEE
                        DUMP s0
                        DROP
                        INMSG_SRC
                        DUMP s0
                        DROP
                        INMSG_VALUE
                        DUMP s0
                        DROP
                        INMSG_VALUEEXTRA
                        DUMP s0
                        DROP
                    }
                ]
                DICTIGETJMPZ
                THROWARG 11
            `,
        ),
    )

    it(
        "GETPARAMLONG in Tolk code",
        test(
            `
                fun getParamLong0(): int asm "0 GETPARAMLONG"
                fun getParamLong1(): int asm "1 GETPARAMLONG"
                fun getParamLong253(): int asm "253 GETPARAMLONG"
                fun getParamLong254(): int asm "254 GETPARAMLONG"
            
                fun onInternalMessage(in: InMessage) {
                    debug.print(getParamLong0());
                    debug.print(getParamLong1());
                    debug.print(getParamLong253());
                    debug.print(getParamLong254());
                }
            `,
            `
                SETCP 0
                DICTPUSHCONST 19 [
                    0 => {
                        DROP
                        INMSG_BOUNCED
                        THROWIF_SHORT 0
                        GETPARAMLONG 0
                        DUMP s0
                        DROP
                        GETPARAMLONG 1
                        DUMP s0
                        DROP
                        GETPARAMLONG2 253
                        DUMP s0
                        DROP
                        GETPARAMLONG2 254
                        DUMP s0
                        DROP
                    }
                ]
                DICTIGETJMPZ
                THROWARG 11
            `,
        ),
    )

    it(
        "INMSGPARAMS in Tolk code",
        test(
            `
                fun inMsgParams(): tuple asm "INMSGPARAMS"
            
                fun onInternalMessage(in: InMessage) {
                    debug.print(inMsgParams());
                }
            `,
            `
                SETCP 0
                DICTPUSHCONST 19 [
                    0 => {
                        DROP
                        INMSG_BOUNCED
                        THROWIF_SHORT 0
                        INMSGPARAMS
                        DUMP s0
                        DROP
                    }
                ]
                DICTIGETJMPZ
                THROWARG 11
            `,
        ),
    )
    it(
        "INMSGPARAM in Tolk code",
        test(
            `
                fun inMsgParam(): tuple asm "1 INMSGPARAM"
            
                fun onInternalMessage(in: InMessage) {
                    debug.print(inMsgParam());
                }
            `,
            `
                SETCP 0
                DICTPUSHCONST 19 [
                    0 => {
                        DROP
                        INMSG_BOUNCED
                        THROWIF_SHORT 0
                        INMSG_BOUNCED
                        DUMP s0
                        DROP
                    }
                ]
                DICTIGETJMPZ
                THROWARG 11
            `,
        ),
    )
})

const compile = async (code: string): Promise<[Cell, string]> => {
    const res = await runTolkCompiler({
        entrypointFileName: "main.tolk",
        fsReadCallback: () => code,
        withStackComments: true,
        withSrcLineComments: true,
    })
    if (res.status === "error") {
        throw new Error(res.message)
    }
    return [Cell.fromBase64(res.codeBoc64), res.fiftCode]
}
