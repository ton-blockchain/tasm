import {compileCell, decompileCell} from "../index"
import {parse, print} from "../../text"
import {normalizeIndentation} from "./utils"
import {Cell} from "@ton/core"
import {runTolkCompiler} from "@ton/tolk-js"

const test = (code: string, expected: string, skipRefs?: boolean): (() => void) => {
    return () => {
        const res = parse("asm.tasm", normalizeIndentation(code))
        if (res.$ === "ParseFailure") {
            throw new Error(res.error.message)
        }
        const compiled = compileCell(res.instructions, {skipRefs: skipRefs ?? false})
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

    it(
        "IFREF -> IF",
        test(
            `
                IFREF {
                    PUSHINT_4 5
                }
            `,
            `
                PUSHCONT_SHORT {
                    PUSHINT_4 5
                }
                IF
            `,
            true,
        ),
    )

    it(
        "IFJMPREF -> IFJMP",
        test(
            `
                IFJMPREF {
                    PUSHINT_4 5
                }
            `,
            `
                PUSHCONT_SHORT {
                    PUSHINT_4 5
                }
                IFJMP
            `,
            true,
        ),
    )

    it(
        "IFREF -> IF 2",
        test(
            `
                PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                IFREF {
                    ${PUSHSLICES}
                }
            `,
            `
                PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                IFREF {
                    ${PUSHSLICES}
                }
            `,
            true,
        ),
    )

    it(
        "Real word DEBUGMARK code",
        test(
            `
                SETCP 0
                DICTPUSHCONST 19 [
                    0 => {
                        INMSG_BOUNCED
                        PUSHCONT_SHORT {
                            DEBUGMARK 6
                            DROP
                            DEBUGMARK 7
                        }
                        IFJMP
                        DEBUGMARK 8
                        DEBUGMARK 9
                        DEBUGMARK 10
                        DEBUGMARK 11
                        DUP
                        DEBUGMARK 12
                        DEBUGMARK 13
                        DEBUGMARK 14
                        DEBUGMARK 15
                        DEBUGMARK 16
                        DEBUGMARK 17
                        DEBUGMARK 18
                        CALLDICT 1
                        PUSHCONT {
                            DEBUGMARK 19
                            CALLDICT 2
                            DEBUGMARK 20
                            DEBUGMARK 21
                            NEQINT 0
                        }
                        PUSHCONT_SHORT {
                            DEBUGMARK 22
                            PUSHINT_4 0
                        }
                        IFELSE
                        PUSHCONT_SHORT {
                            DEBUGMARK 23
                            DROP2
                            DEBUGMARK 24
                            DEBUGMARK 25
                            THROW_SHORT 20
                        }
                        IFJMP
                        DEBUGMARK 26
                        SDBEGINSQ x{7E8764EF}
                        IFJMPREF {
                            DEBUGMARK 27
                            NIP
                            DEBUGMARK 28
                            DEBUGMARK 29
                            DEBUGMARK 30
                            DEBUGMARK 31
                            DEBUGMARK 32
                            PUSHCTR c4
                            CTOS
                            DEBUGMARK 33
                            DEBUGMARK 34
                            DEBUGMARK 35
                            DEBUGMARK 36
                            DEBUGMARK 37
                            SWAP
                            LDU 64
                            NIP
                            PLDU 32
                            SWAP
                            LDSLICE 32
                            PLDU 32
                            DEBUGMARK 38
                            DEBUGMARK 39
                            DEBUGMARK 40
                            DEBUGMARK 41
                            DEBUGMARK 42
                            DEBUGMARK 43
                            ROT
                            ADD
                            DEBUGMARK 44
                            DEBUGMARK 45
                            DEBUGMARK 46
                            DEBUGMARK 47
                            DEBUGMARK 48
                            DEBUGMARK 49
                            DEBUGMARK 50
                            DEBUGMARK 51
                            SWAP
                            NEWC
                            STSLICE
                            STU 32
                            ENDC
                            ref {
                                DEBUGMARK 52
                                POPCTR c4
                            }
                        }
                        SDBEGINSQ x{3A752F06}
                        NIP
                        ref {
                            PUSHCONT {
                                DEBUGMARK 53
                                DROP
                                DEBUGMARK 54
                                DEBUGMARK 55
                                DEBUGMARK 56
                                DEBUGMARK 57
                                DEBUGMARK 58
                                PUSHCTR c4
                                CTOS
                                DEBUGMARK 59
                                DEBUGMARK 60
                                DEBUGMARK 61
                                DEBUGMARK 62
                                DEBUGMARK 63
                                LDSLICE 32
                                DROP
                                DEBUGMARK 64
                                DEBUGMARK 65
                                DEBUGMARK 66
                                DEBUGMARK 67
                                DEBUGMARK 68
                                DEBUGMARK 69
                                DEBUGMARK 70
                                DEBUGMARK 71
                                DEBUGMARK 72
                                DEBUGMARK 73
                                DEBUGMARK 74
                                DEBUGMARK 75
                                NEWC
                                STSLICE
                                STSLICECONST x{00000000}
                                ENDC
                                DEBUGMARK 76
                                POPCTR c4
                            }
                            IFJMP
                            DEBUGMARK 77
                            DEBUGMARK 78
                            ref {
                                DEBUGMARK 79
                                PUSHPOW2DEC 16
                                DEBUGMARK 80
                                SWAP
                                SEMPTY
                                DEBUGMARK 81
                                THROWANYIFNOT
                            }
                        }
                    }
                    1 => {
                        DEBUGMARK 0
                        DEBUGMARK 1
                        DEBUGMARK 2
                        PUSHINT_4 -1
                    }
                    2 => {
                        DEBUGMARK 3
                        DEBUGMARK 4
                        DEBUGMARK 5
                        PUSHINT_4 -1
                    }
                    71937 => {
                        DEBUGMARK 94
                        DEBUGMARK 95
                        DEBUGMARK 96
                        DEBUGMARK 97
                        DEBUGMARK 98
                        PUSHCTR c4
                        CTOS
                        DEBUGMARK 99
                        DEBUGMARK 100
                        DEBUGMARK 101
                        DEBUGMARK 102
                        DEBUGMARK 103
                        PLDU 32
                        DEBUGMARK 104
                        DEBUGMARK 105
                    }
                    117456 => {
                        DEBUGMARK 82
                        DEBUGMARK 83
                        DEBUGMARK 84
                        DEBUGMARK 85
                        DEBUGMARK 86
                        PUSHCTR c4
                        CTOS
                        DEBUGMARK 87
                        DEBUGMARK 88
                        DEBUGMARK 89
                        DEBUGMARK 90
                        DEBUGMARK 91
                        LDU 32
                        NIP
                        PLDU 32
                        DEBUGMARK 92
                        DEBUGMARK 93
                    }
                ]
                DICTIGETJMPZ
                THROWARG 11
            `,
            `
                SETCP 0
                DICTPUSHCONST 19 [
                    0 => {
                        INMSG_BOUNCED
                        PUSHCONT_SHORT {
                            DROP
                        }
                        IFJMP
                        DUP
                        CALLDICT 1
                        PUSHCONT {
                            CALLDICT 2
                            NEQINT 0
                        }
                        PUSHCONT_SHORT {
                            PUSHINT_4 0
                        }
                        IFELSE
                        PUSHCONT_SHORT {
                            DROP2
                            THROW_SHORT 20
                        }
                        IFJMP
                        SDBEGINSQ x{7E8764EF}
                        PUSHCONT {
                            NIP
                            PUSHCTR c4
                            CTOS
                            SWAP
                            LDU 64
                            NIP
                            PLDU 32
                            SWAP
                            LDSLICE 32
                            PLDU 32
                            ROT
                            ADD
                            SWAP
                            NEWC
                            STSLICE
                            STU 32
                            ENDC
                            POPCTR c4
                        }
                        IFJMP
                        SDBEGINSQ x{3A752F06}
                        NIP
                        PUSHCONT {
                            DROP
                            PUSHCTR c4
                            CTOS
                            LDSLICE 32
                            DROP
                            NEWC
                            STSLICE
                            STSLICECONST x{00000000}
                            ENDC
                            POPCTR c4
                        }
                        IFJMP
                        PUSHPOW2DEC 16
                        SWAP
                        SEMPTY
                        THROWANYIFNOT
                    }
                    1 => {
                        PUSHINT_4 -1
                    }
                    2 => {
                        PUSHINT_4 -1
                    }
                    71937 => {
                        PUSHCTR c4
                        CTOS
                        PLDU 32
                    }
                    117456 => {
                        PUSHCTR c4
                        CTOS
                        LDU 32
                        NIP
                        PLDU 32
                    }
                ]
                DICTIGETJMPZ
                THROWARG 11
            `,
            true,
        ),
    )

    it("should compile", async () => {
        const code = `
            SETCP 0
            DICTPUSHCONST 19 [
                0 => {
                    INMSG_BOUNCED
                    PUSHCONT_SHORT {
                        DEBUGMARK 6
                        DROP
                        DEBUGMARK 7
                    }
                    IFJMP
                    DEBUGMARK 8
                    DEBUGMARK 9
                    DEBUGMARK 10
                    DEBUGMARK 11
                    DUP
                    DEBUGMARK 12
                    DEBUGMARK 13
                    DEBUGMARK 14
                    DEBUGMARK 15
                    DEBUGMARK 16
                    DEBUGMARK 17
                    DEBUGMARK 18
                    CALLDICT 1
                    PUSHCONT_SHORT {
                        DEBUGMARK 19
                        CALLDICT 2
                        DEBUGMARK 20
                        DEBUGMARK 21
                        NEQINT 0
                    }
                    PUSHCONT_SHORT {
                        DEBUGMARK 22
                        PUSHINT_4 0
                    }
                    IFELSE
                    PUSHCONT_SHORT {
                        DEBUGMARK 24
                        DEBUGMARK 25
                        THROW_SHORT 20
                    }
                    IFJMP
                    DEBUGMARK 26
                    SDBEGINSQ x{7E8764EF}
                    IFJMPREF {
                        DEBUGMARK 27
                        NIP
                        DEBUGMARK 28
                        DEBUGMARK 29
                        DEBUGMARK 30
                        DEBUGMARK 31
                        DEBUGMARK 32
                        PUSHCTR c4
                        CTOS
                        DEBUGMARK 33
                        DEBUGMARK 34
                        DEBUGMARK 35
                        DEBUGMARK 36
                        DEBUGMARK 37
                        SWAP
                        LDU 64
                        NIP
                        PLDU 32
                        SWAP
                        LDSLICE 32
                        PLDU 32
                        DEBUGMARK 38
                        DEBUGMARK 39
                        DEBUGMARK 40
                        DEBUGMARK 41
                        DEBUGMARK 42
                        DEBUGMARK 43
                        ROT
                        ADD
                        DEBUGMARK 44
                        DEBUGMARK 45
                        DEBUGMARK 46
                        DEBUGMARK 47
                        DEBUGMARK 48
                        DEBUGMARK 49
                        DEBUGMARK 50
                        DEBUGMARK 51
                        SWAP
                        NEWC
                        STSLICE
                        STU 32
                        ENDC
                        ref {
                            DEBUGMARK 52
                            POPCTR c4
                        }
                    }
                    SDBEGINSQ x{3A752F06}
                    NIP
                    ref {
                        PUSHCONT {
                            DEBUGMARK 53
                            DROP
                            DEBUGMARK 54
                            DEBUGMARK 55
                            DEBUGMARK 56
                            DEBUGMARK 57
                            DEBUGMARK 58
                            PUSHCTR c4
                            CTOS
                            DEBUGMARK 59
                            DEBUGMARK 60
                            DEBUGMARK 61
                            DEBUGMARK 62
                            DEBUGMARK 63
                            LDSLICE 32
                            DROP
                            DEBUGMARK 64
                            DEBUGMARK 65
                            DEBUGMARK 66
                            DEBUGMARK 67
                            DEBUGMARK 68
                            DEBUGMARK 69
                            DEBUGMARK 70
                            DEBUGMARK 71
                            DEBUGMARK 72
                            DEBUGMARK 73
                            DEBUGMARK 74
                            DEBUGMARK 75
                            NEWC
                            STSLICE
                            STSLICECONST x{00000000}
                            ENDC
                            DEBUGMARK 76
                            POPCTR c4
                        }
                        IFJMP
                        DEBUGMARK 77
                        DEBUGMARK 78
                        ref {
                            DEBUGMARK 79
                            PUSHPOW2DEC 16
                            DEBUGMARK 80
                            SWAP
                            SEMPTY
                            DEBUGMARK 81
                            THROWANYIFNOT
                        }
                    }
                }
                1 => {
                    DEBUGMARK 0
                    DEBUGMARK 1
                    DEBUGMARK 2
                    PUSHINT_4 -1
                }
                2 => {
                    DEBUGMARK 3
                    DEBUGMARK 4
                    DEBUGMARK 5
                    PUSHINT_4 -1
                }
                71937 => {
                    DEBUGMARK 94
                    DEBUGMARK 95
                    DEBUGMARK 96
                    DEBUGMARK 97
                    DEBUGMARK 98
                    PUSHCTR c4
                    CTOS
                    DEBUGMARK 99
                    DEBUGMARK 100
                    DEBUGMARK 101
                    DEBUGMARK 102
                    DEBUGMARK 103
                    PLDU 32
                    DEBUGMARK 104
                    DEBUGMARK 105
                }
                117456 => {
                    DEBUGMARK 82
                    DEBUGMARK 83
                    DEBUGMARK 84
                    DEBUGMARK 85
                    DEBUGMARK 86
                    PUSHCTR c4
                    CTOS
                    DEBUGMARK 87
                    DEBUGMARK 88
                    DEBUGMARK 89
                    DEBUGMARK 90
                    DEBUGMARK 91
                    LDU 32
                    NIP
                    PLDU 32
                    DEBUGMARK 92
                    DEBUGMARK 93
                }
            ]
            DICTIGETJMPZ
            THROWARG 11
        `

        const originalCode = `
            tolk 1.0
            
            // this struct defines storage layout of the contract
            struct Storage {
                id: uint32 // required to allow multiple independent counter instances, since the contract address depends on its initial state
                counter: uint32 // the current counter value
            }
            
            // load contract data from the persistent storage
            fun Storage.load() {
                return Storage.fromCell(contract.getData());
            }
            
            // save contract data into the persistent storage
            fun Storage.save(self) {
                contract.setData(self.toCell());
            }
            
            // the struct uses a 32-bit opcode prefix for message identification
            struct (0x7e8764ef) IncreaseCounter {
                queryId: uint64 // query id, typically included in messages
                increaseBy: uint32
            }
            
            struct (0x3a752f06) ResetCounter {
                queryId: uint64
            }
            
            // using unions to represent available messages
            // this allows processing them with pattern matching
            type AllowedMessage = IncreaseCounter | ResetCounter
            
            @noinline
            fun first(): bool { return true }
            
            @noinline
            fun second(): bool { return true }
            
            // the main entrypoint: called when a contract receives an message from other contracts
            fun onInternalMessage(in: InMessage) {
                val msg = lazy AllowedMessage.fromSlice(in.body);
            
                if (
                    first() 
                    && second()
                ) {
                    throw 20;
                }
            
                match (msg) {
                    IncreaseCounter => {
                        // load contract storage lazily (efficient for large or partial reads/updates)
                        var storage = lazy Storage.load();
            
                        storage.counter += msg.increaseBy;
                        storage.save();
                    }
            
                    ResetCounter => {
                        var storage = lazy Storage.load();
            
                        storage.counter = 0;
                        storage.save();
                    }
            
                    else => {
                        // ignore empty messages, "wrong opcode" for others
                        assert (in.body.isEmpty()) throw 0xFFFF;
                    }
                }
            }
            
            // a handler for bounced messages (not used here, may be ommited)
            fun onBouncedMessage(in: InMessageBounced) {}
            
            // get methods are a means to conveniently read contract data using, for example, HTTP APIs
            // note that unlike in many other smart contract VMs, get methods cannot be called by other contracts
            get fun currentCounter(): int {
                val storage = lazy Storage.load();
                return storage.counter;
            }
            
            get fun initialId(): int {
                val storage = lazy Storage.load();
                return storage.id;
            }
        `

        const res = parse("asm.tasm", normalizeIndentation(code))
        if (res.$ === "ParseFailure") {
            throw new Error(res.error.message)
        }
        const compiled = compileCell(res.instructions, {skipRefs: true})
        const disasn = decompileCell(compiled)
        const disasmText = print(disasn)

        const originalInstructions = decompileCell(await compile(originalCode))
        const originalText = print(originalInstructions)

        expect(disasmText).toEqual(originalText)
    })
})

describe("skipRef", () => {
    it(
        "should skip explicit refs in skipRef mode",
        test(
            `
                ref { PUSHINT_4 1 }
                ref { PUSHINT_4 1 }
                ref { PUSHINT_4 1 }
                ref { PUSHINT_4 1 }
                ref { PUSHINT_4 1 }
                ref { PUSHINT_4 1 }
            `,
            `
                PUSHINT_4 1
                PUSHINT_4 1
                PUSHINT_4 1
                PUSHINT_4 1
                PUSHINT_4 1
                PUSHINT_4 1
            `,
            true,
        ),
    )

    it(
        "should skip explicit refs in skipRef mode but add new one if needed",
        test(
            `
                PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                
                ref { PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF} }
                ref { PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF} }
                
                ref { PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF} }
            `,
            `
                PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                ref {
                    PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                }
            `,
            true,
        ),
    )

    it(
        "should skip explicit refs in skipRef mode but add new one if needed 2",
        test(
            `
                PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                
                ref { PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF} }
                ref { PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF} }
                
                ref {
                    PUSHINT_4 10
                    PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                }
            `,
            `
                PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                PUSHINT_4 10
                ref {
                    PUSHSLICE_LONG x{FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
                }
            `,
            true,
        ),
    )
})

const compile = async (code: string): Promise<Cell> => {
    const res = await runTolkCompiler({
        entrypointFileName: "main.tolk",
        fsReadCallback: () => code,
        withStackComments: true,
        withSrcLineComments: true,
    })
    if (res.status === "error") {
        throw new Error(res.message)
    }
    return Cell.fromBase64(res.codeBoc64)
}
