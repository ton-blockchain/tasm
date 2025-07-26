import {decompileCell} from "../../runtime"
import {print} from "../printer"
import {readFileSync} from "node:fs"
import {parse} from "../parse"
import {boc} from "../../runtime/util"

describe("assembly-parser", () => {
    it("should parse simple assembly", () => {
        const code = `
            PUSHINT_4 10
            PUSHINT_4 5
            ADD
        `
        const res = parse("test.asm", code)
        if (res.$ === "ParseFailure") {
            throw new Error("unexpected parser error")
        }

        expect(print(res.instructions)).toMatchSnapshot()
    })

    it("should parse assembly with raw pushref", () => {
        const code = `
            PUSHREF x{71}
        `
        const res = parse("test.asm", code)
        if (res.$ === "ParseFailure") {
            throw new Error("unexpected parser error")
        }

        expect(print(res.instructions)).toMatchSnapshot()
    })

    it("should parse assembly with invalid raw pushref", () => {
        const code = `
            PUSHREF x{22221}
        `
        const res = parse("test.asm", code)
        if (res.$ === "ParseFailure") {
            throw new Error("unexpected parser error")
        }

        expect(print(res.instructions)).toMatchSnapshot()
    })

    it("should parse and print assembly", () => {
        const instructions = decompileCell(
            boc(
                readFileSync(
                    `${__dirname}/testdata/jetton_minter_discoverable_JettonMinter.boc`,
                ).toString("hex"),
            ).asCell(),
        )
        const assembly = print(instructions)

        const res = parse("test.asm", assembly)
        if (res.$ === "ParseFailure") {
            throw new Error("unexpected parser error")
        }

        const assembly2 = print(res.instructions)

        expect(assembly2).toEqual(assembly)
    })

    it("should not parse assembly with error", () => {
        const code = `
            PUSHINT_4 10 ,
            PUSHINT_4 5
            ADD
        `
        const res = parse("test.asm", code)
        if (res.$ === "ParseSuccess") {
            throw new Error("unexpected parser success")
        }

        expect(res.error.toString()).toMatchSnapshot()
    })

    it("should give an error for malformed assembly", () => {
        const code = `
            PUSHINT_4 // no arg
            PUSHINT_4 5
            ADD
        `
        const res = parse("test.asm", code)
        if (res.$ === "ParseSuccess") {
            throw new Error("unexpected parser success")
        }

        expect(res.error.toString()).toMatchSnapshot()
    })

    it("should parse big hex number", () => {
        const code = `
            PUSHINT_LONG 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF
            PUSHINT_LONG -0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF
            ADD
        `
        const res = parse("test.asm", code)
        if (res.$ === "ParseFailure") {
            throw new Error("unexpected parser error")
        }

        expect(print(res.instructions)).toMatchSnapshot()
    })

    it("should parse big decimal number", () => {
        const code = `
            PUSHINT_LONG 999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999
            PUSHINT_LONG -999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999
            ADD
        `
        const res = parse("test.asm", code)
        if (res.$ === "ParseFailure") {
            throw new Error("unexpected parser error")
        }

        expect(print(res.instructions)).toMatchSnapshot()
    })

    it("should parse big binary number", () => {
        const code = `
            PUSHINT_LONG 0b111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
            PUSHINT_LONG -0b111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
            ADD
        `
        const res = parse("test.asm", code)
        if (res.$ === "ParseFailure") {
            throw new Error("unexpected parser error")
        }

        expect(print(res.instructions)).toMatchSnapshot()
    })

    it("should parse big octal number", () => {
        const code = `
            PUSHINT_LONG 0o7777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777
            PUSHINT_LONG -0o7777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777
            ADD
        `
        const res = parse("test.asm", code)
        if (res.$ === "ParseFailure") {
            throw new Error("unexpected parser error")
        }

        expect(print(res.instructions)).toMatchSnapshot()
    })

    it("should parse hex number", () => {
        const code = `
            PUSHINT_16 0xFFF
            PUSHINT_16 -0xFFF
            ADD
        `
        const res = parse("test.asm", code)
        if (res.$ === "ParseFailure") {
            throw new Error("unexpected parser error")
        }

        expect(print(res.instructions)).toMatchSnapshot()
    })

    it("should parse decimal number", () => {
        const code = `
            PUSHINT_16 999999
            PUSHINT_16 -999999
            ADD
        `
        const res = parse("test.asm", code)
        if (res.$ === "ParseFailure") {
            throw new Error("unexpected parser error")
        }

        expect(print(res.instructions)).toMatchSnapshot()
    })

    it("should parse binary number", () => {
        const code = `
            PUSHINT_16 0b1111111111
            PUSHINT_16 -0b1111111111
            ADD
        `
        const res = parse("test.asm", code)
        if (res.$ === "ParseFailure") {
            throw new Error("unexpected parser error")
        }

        expect(print(res.instructions)).toMatchSnapshot()
    })

    it("should parse octal number", () => {
        const code = `
            PUSHINT_16 0o77777
            PUSHINT_16 -0o77777
            ADD
        `
        const res = parse("test.asm", code)
        if (res.$ === "ParseFailure") {
            throw new Error("unexpected parser error")
        }

        expect(print(res.instructions)).toMatchSnapshot()
    })

    it("should give an error for too big number ", () => {
        const code = `
            PUSHINT_4 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF
            PUSHINT_4 5
            ADD
        `
        const res = parse("test.asm", code)
        if (res.$ === "ParseSuccess") {
            throw new Error("unexpected parser success")
        }

        expect(res.error.toString()).toMatchSnapshot()
    })

    it("should parse hex number with _", () => {
        const code = `
            PUSHINT_16 0xF_FF
            PUSHINT_16 -0xF_F_F
            ADD
        `
        const res = parse("test.asm", code)
        if (res.$ === "ParseFailure") {
            throw new Error(`unexpected parser error ${res.error.message}`)
        }

        expect(print(res.instructions)).toMatchSnapshot()
    })

    it("should parse decimal number with _", () => {
        const code = `
            PUSHINT_16 999_999
            PUSHINT_16 -99_99_99
            ADD
        `
        const res = parse("test.asm", code)
        if (res.$ === "ParseFailure") {
            throw new Error("unexpected parser error")
        }

        expect(print(res.instructions)).toMatchSnapshot()
    })

    it("should parse binary number with _", () => {
        const code = `
            PUSHINT_16 0b11111_11111
            PUSHINT_16 -0b111_11_11_1_11
            ADD
        `
        const res = parse("test.asm", code)
        if (res.$ === "ParseFailure") {
            throw new Error("unexpected parser error")
        }

        expect(print(res.instructions)).toMatchSnapshot()
    })

    it("should parse octal number with _", () => {
        const code = `
            PUSHINT_16 0o777_77
            PUSHINT_16 -0o7_77_77
            ADD
        `
        const res = parse("test.asm", code)
        if (res.$ === "ParseFailure") {
            throw new Error("unexpected parser error")
        }

        expect(print(res.instructions)).toMatchSnapshot()
    })

    it("should parse fift instruction", () => {
        const code = `
            fPUSHINT 10
            fPUSHINT 999
            ADD
        `
        const res = parse("test.asm", code)
        if (res.$ === "ParseFailure") {
            throw new Error("unexpected parser error")
        }

        expect(print(res.instructions)).toMatchSnapshot()
    })
})
