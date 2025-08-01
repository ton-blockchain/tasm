import {parse} from "../parse"
import * as fs from "node:fs"

describe("Fift Parser", () => {
    it("should parse basic program", () => {
        const code = `"Asm.fif" include
        PROGRAM{
            DECLPROC test
            test PROC:<{
                DUP
            }>
        }END>c`

        const result = parse("test.fift", code)

        if (result.$ === "ParseFailure") {
            console.log("Parse error:", result.error.message)
        }

        expect(result.$).toBe("ParseSuccess")
        if (result.$ === "ParseSuccess") {
            expect(result.ast.program.declarations).toHaveLength(1)
            expect(result.ast.program.definitions).toHaveLength(1)

            expect(result.ast).toMatchSnapshot()
        }
    })

    it("should parse 2DROP", () => {
        const code = `"Asm.fif" include
        PROGRAM{
            DECLPROC test
            test PROC:<{
                2DROP
            }>
        }END>c`

        const result = parse("test.fift", code)

        if (result.$ === "ParseFailure") {
            console.log("Parse error:", result.error.message)
        }

        expect(result.$).toBe("ParseSuccess")
        if (result.$ === "ParseSuccess") {
            expect(result.ast.program.declarations).toHaveLength(1)
            expect(result.ast.program.definitions).toHaveLength(1)

            expect(result.ast).toMatchSnapshot()
        }
    })

    it("should parse Foo.bar() CALLDICT", () => {
        const code = `"Asm.fif" include
        PROGRAM{
            DECLPROC test
            DECLPROC Foo.bar()
            test PROC:<{
                Foo.bar() CALLDICT
            }>
        }END>c`

        const result = parse("test.fift", code)

        if (result.$ === "ParseFailure") {
            console.log("Parse error:", result.error.message)
        }

        expect(result.$).toBe("ParseSuccess")
        if (result.$ === "ParseSuccess") {
            expect(result.ast.program.declarations).toHaveLength(2)
            expect(result.ast.program.definitions).toHaveLength(1)

            expect(result.ast).toMatchSnapshot()
        }
    })

    it("should parse PLDREF", () => {
        const code = `"Asm.fif" include
        PROGRAM{
            DECLPROC test
            test PROC:<{
                PLDREF
            }>
        }END>c`

        const result = parse("test.fift", code)

        if (result.$ === "ParseFailure") {
            console.log("Parse error:", result.error.message)
        }

        expect(result.$).toBe("ParseSuccess")
        if (result.$ === "ParseSuccess") {
            expect(result.ast.program.declarations).toHaveLength(1)
            expect(result.ast.program.definitions).toHaveLength(1)

            expect(result.ast).toMatchSnapshot()
        }
    })

    it("should parse program with include", () => {
        const code = `"Asm.fif" include
            PROGRAM{
                DECLPROC test
                test PROC:<{
                    SWAP
                }>
        }END>c`

        const result = parse("test.fift", code)

        expect(result.$).toBe("ParseSuccess")
        if (result.$ === "ParseSuccess") {
            expect(result.ast.include).toBeDefined()
            expect(result.ast.include?.path).toBe("Asm.fif")

            expect(result.ast).toMatchSnapshot()
        }
    })

    it("should parse method declaration", () => {
        const code = `PROGRAM{
            85143 DECLMETHOD seqno
            seqno METHOD:<{
                1 GETPARAM
            }>
        }END>c`

        const result = parse("test.fift", code)

        expect(result.$).toBe("ParseSuccess")
        if (result.$ === "ParseSuccess") {
            expect(result.ast.program.declarations).toHaveLength(1)
            const decl = result.ast.program.declarations[0]
            expect(decl?.decl.$).toBe("MethodDeclaration")

            expect(result.ast).toMatchSnapshot()
        }
    })

    it("should parse method declaration with name with ()", () => {
        const code = `PROGRAM{
            85143 DECLMETHOD seqno()
            seqno() METHOD:<{
                1 GETPARAM
            }>
        }END>c`

        const result = parse("test.fift", code)

        expect(result.$).toBe("ParseSuccess")
        if (result.$ === "ParseSuccess") {
            expect(result.ast.program.declarations).toHaveLength(1)
            const decl = result.ast.program.declarations[0]
            expect(decl?.decl.$).toBe("MethodDeclaration")

            expect(result.ast).toMatchSnapshot()
        }
    })

    it("should parse if statement", () => {
        const code = `PROGRAM{
            DECLPROC test
            test PROC:<{
                IF:<{
                    DUP
                }>ELSE<{
                    DROP
                }>
            }>
        }END>c`

        const result = parse("test.fift", code)

        expect(result.$).toBe("ParseSuccess")
        if (result.$ === "ParseSuccess") {
            expect(result.ast).toMatchSnapshot()
        }
    })

    it("should parse while statement", () => {
        const code = `PROGRAM{
            DECLPROC test
            test PROC:<{
                WHILE:<{
                    DUP
                }>DO<{
                    1 SUB
                }>
            }>
        }END>c`

        const result = parse("test.fift", code)

        expect(result.$).toBe("ParseSuccess")
        if (result.$ === "ParseSuccess") {
            expect(result.ast).toMatchSnapshot()
        }
    })

    it("should parse slice literals", () => {
        const code = `PROGRAM{
            DECLPROC test
            test PROC:<{
                b{010101} PUSHSLICE
                x{ABCDEF} PUSHSLICE
                B{123456} PUSHSLICE
            }>
        }END>c`

        const result = parse("test.fift", code)

        expect(result.$).toBe("ParseSuccess")
        if (result.$ === "ParseSuccess") {
            expect(result.ast).toMatchSnapshot()
        }
    })

    it("should parse fift address none", () => {
        const code = `PROGRAM{
            DECLPROC test
            test PROC:<{
                <b 0 2 u, b> <s PUSHSLICE
                <b   0   2 u,   b>  <s   PUSHSLICE
            }>
        }END>c`

        const result = parse("test.fift", code)

        expect(result.$).toBe("ParseSuccess")
        if (result.$ === "ParseSuccess") {
            expect(result.ast).toMatchSnapshot()
        }
    })

    it("should parse stack operations", () => {
        const code = `PROGRAM{
            DECLPROC test
            test PROC:<{
                s(-1) XCHG
                s0 s1 XCHG
                s5 s(-1) PUXC
            }>
        }END>c`

        const result = parse("test.fift", code)

        expect(result.$).toBe("ParseSuccess")
        if (result.$ === "ParseSuccess") {
            expect(result.ast).toMatchSnapshot()
        }
    })

    it("should parse complex example", () => {
        const code = `"Asm.fif" include
        
        PROGRAM{
            DECLPROC recv_internal
            DECLGLOBVAR storage
            85143 DECLMETHOD seqno
        
            recv_internal PROC:<{
                // Load storage
                1 GETPARAM
                CTOS
                
                // Parse message
                32 LDU
                SWAP
                32 LDU
                
                // Check seqno
                seqno CALLDICT
                EQUAL
                
                IF:<{
                    // Valid seqno, process transaction
                    storage GETGLOB
                    1 ADDCONST
                    storage SETGLOB
                }>ELSE<{
                    // Invalid seqno, throw error
                    35 THROWIF
                }>
            }>
        
            seqno METHOD:<{
                storage GETGLOB
                32 PUSHINT
                DIVMOD
                NIP
            }>
        }END>c `

        const result = parse("test.fift", code)

        expect(result.$).toBe("ParseSuccess")
        if (result.$ === "ParseSuccess") {
            expect(result.ast).toMatchSnapshot()
        }
    })

    it("should parse real world example", () => {
        const code = `PROGRAM{
  DECLPROC $Foo$_contract_init
  DECLPROC $Foo$_contract_load
  83229 DECLMETHOD $SampleTactContract$_fun_owner
  105001 DECLMETHOD $global_bar
  104984 DECLMETHOD $SampleTactContract$_fun_counter
  DECLPROC recv_internal
  65535 DECLMETHOD __tact_selector_hack
  DECLGLOBVAR __tact_context
  DECLGLOBVAR __tact_context_sender
  DECLGLOBVAR __tact_child_contract_codes
  DECLGLOBVAR __tact_randomized
  $Foo$_contract_init PROCINLINE:<{
    PUSHNULL
  }>
  $Foo$_contract_load PROCINLINE:<{
    c4 PUSH
    CTOS
    1 LDI
    DROP
    IF:<{
      PUSHNULL
    }>ELSE<{
      $Foo$_contract_init INLINECALLDICT
    }>
  }>
  $SampleTactContract$_fun_owner PROC:<{
    OVER
  }>
  $global_bar PROC:<{
  }>
  $SampleTactContract$_fun_counter PROC:<{
    DUP
  }>
  recv_internal PROC:<{
    DROP
    CTOS
    2 PUSHINT
    SDSKIPFIRST
    1 LDI
    1 LDI
    LDMSGADDR
    OVER
    s3 s4 XCHG
    s5 s5 XCHG2
    4 TUPLE
    __tact_context SETGLOB
    SWAP
    __tact_context_sender SETGLOB
    $Foo$_contract_load INLINECALLDICT
    DROP
    IFJMP:<{
    }>
    130 THROW
  }>
}END>c`

        const result = parse("test.fift", code)

        expect(result.$).toBe("ParseSuccess")
        if (result.$ === "ParseSuccess") {
            expect(result.ast).toMatchSnapshot()
        }
    })

    it("should parse real world FunC example", () => {
        const code = fs.readFileSync(`${__dirname}/testdata/JettonWallet.00-FunC.fif`, "utf8")

        const result = parse("test.fift", code)

        if (result.$ === "ParseFailure") {
            console.log(result.error)
        }
        expect(result.$).toBe("ParseSuccess")
        if (result.$ === "ParseSuccess") {
            expect(result.ast).toMatchSnapshot()
        }
    })

    it("should parse real world Tolk example", () => {
        const code = fs.readFileSync(`${__dirname}/testdata/JettonWallet.00-Tolk.fif`, "utf8")

        const result = parse("test.fift", code)

        if (result.$ === "ParseFailure") {
            console.log(result.error)
        }
        expect(result.$).toBe("ParseSuccess")
        if (result.$ === "ParseSuccess") {
            expect(result.ast).toMatchSnapshot()
        }
    })

    it("should handle parse errors", () => {
        const code = `PROGRAM{
            INVALID SYNTAX
        }END>c`

        const result = parse("test.fift", code)

        expect(result.$).toBe("ParseFailure")
        if (result.$ === "ParseFailure") {
            expect(result.error.message).toContain("Expected")
        }
    })
})
