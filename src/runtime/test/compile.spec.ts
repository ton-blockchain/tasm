import {compileCellWithMapping, decompileCell} from "../instr"
import {parse, print} from "../../text"
import * as fs from "node:fs"
import {diffLines} from "diff"

const test = (text: string): (() => void) => {
    return () => {
        const res = parse("test.asm", text)
        if (res.$ === "ParseFailure") {
            return
        }

        const [compiled] = compileCellWithMapping(res.instructions, {skipRefs: true})
        expect(compiled.hash().toString("hex")).toMatchSnapshot()

        const withoutDebugMarks = text
            .split(/\n/)
            .filter(line => !line.includes("DEBUGMARK"))
            .join("\n")

        const res2 = parse("test.asm", withoutDebugMarks)
        if (res2.$ === "ParseFailure") {
            return
        }

        const [compiled2] = compileCellWithMapping(res2.instructions, {skipRefs: true})
        expect(compiled2.hash().toString("hex")).toMatchSnapshot()

        expect(compiled.hash().toString("hex")).toEqual(compiled2.hash().toString("hex"))

        const compiledAssembly = print(decompileCell(compiled))
        const compiledAssembly2 = print(decompileCell(compiled2))

        if (compiledAssembly !== compiledAssembly2) {
            console.log(diffLines(compiledAssembly, compiledAssembly2))
            expect(true).toBe(false)
        }
    }
}

describe("Compile", () => {
    it(
        "should compile Vault with skipRefs option enabled",
        test(fs.readFileSync(`${__dirname}/testdata/Vault.tasm`, "utf8")),
    )
})
