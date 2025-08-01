import {execSync} from "node:child_process"
import {readFileSync, rmSync, writeFileSync} from "node:fs"
import * as path from "node:path"
import {Cell} from "@ton/core"

const CLI_PATH = path.join(__dirname, "..", "..", "..", "dist", "cli", "fift-compiler.js")

describe("Fift assembly compiler CLI", () => {
    const testDir = path.join(__dirname, "temp")
    const testInputFile = path.join(testDir, "test.fif")
    const testOutputFile = path.join(testDir, "test.boc")

    beforeEach(() => {
        try {
            rmSync(testDir, {recursive: true, force: true})
        } catch {
            // ignore
        }
        execSync(`mkdir -p "${testDir}"`)
    })

    afterEach(() => {
        try {
            rmSync(testDir, {recursive: true, force: true})
        } catch {
            // ignore
        }
    })

    it("should compile simple Fift assembly file to BOC", () => {
        const fiftCode = `"Asm.fif" include

PROGRAM{
  DECLGLOBVAR $test_var
  0 DECLMETHOD recv_internal()
  
  recv_internal() PROC:<{
    42 PUSHINT
    $test_var SETGLOB
  }>
}END>c`

        writeFileSync(testInputFile, fiftCode)

        const result = execSync(`node "${CLI_PATH}" "${testInputFile}" -o "${testOutputFile}"`, {
            encoding: "utf8",
        })

        expect(result).toBe("")

        // Verify BOC file was created and is valid
        const bocBuffer = readFileSync(testOutputFile)
        expect(bocBuffer.length).toBeGreaterThan(0)

        const cell = Cell.fromBoc(bocBuffer)[0]
        expect(cell).toBeDefined()
    })

    it("should output to stdout in hex format", () => {
        const fiftCode = `"Asm.fif" include

PROGRAM{
  0 DECLMETHOD recv_internal()
  recv_internal() PROC:<{
    1 PUSHINT
    DROP
  }>
}END>c`

        writeFileSync(testInputFile, fiftCode)

        const result = execSync(`node "${CLI_PATH}" "${testInputFile}" -f hex`, {
            encoding: "utf8",
        })

        expect(result.trim()).toMatchSnapshot()
    })

    it("should output to stdout in base64 format", () => {
        const fiftCode = `"Asm.fif" include

PROGRAM{
  0 DECLMETHOD recv_internal()
  recv_internal() PROC:<{
    1 PUSHINT
    DROP
  }>
}END>c`

        writeFileSync(testInputFile, fiftCode)

        const result = execSync(`node "${CLI_PATH}" "${testInputFile}" -f base64`, {
            encoding: "utf8",
        })

        expect(result.trim()).toMatchSnapshot()
    })

    it("should compile from string input", () => {
        const fiftCode = `"Asm.fif" include
PROGRAM{
  0 DECLMETHOD recv_internal()
  recv_internal() PROC:<{
    1 PUSHINT
    DROP
  }>
}END>c`

        const result = execSync(`node "${CLI_PATH}" -s '${fiftCode}' -f hex`, {
            encoding: "utf8",
        })

        expect(result.trim()).toMatchSnapshot()
    })

    it("should show verbose output", () => {
        const fiftCode = `"Asm.fif" include

PROGRAM{
  0 DECLMETHOD recv_internal()
  recv_internal() PROC:<{
    1 PUSHINT
    DROP
  }>
}END>c`

        writeFileSync(testInputFile, fiftCode)

        const result = execSync(`node "${CLI_PATH}" "${testInputFile}" --verbose -f hex`, {
            encoding: "utf8",
        })

        expect(result).toMatchSnapshot()
    })

    it("should handle parse errors gracefully", () => {
        const invalidFiftCode = `invalid syntax here`

        writeFileSync(testInputFile, invalidFiftCode)

        expect(() => {
            execSync(`node "${CLI_PATH}" "${testInputFile}"`, {
                encoding: "utf8",
                stdio: "pipe",
            })
        }).toThrow()
    })

    it("should require input file or string", () => {
        expect(() => {
            execSync(`node "${CLI_PATH}"`, {
                encoding: "utf8",
                stdio: "pipe",
            })
        }).toThrow()
    })

    it("should show help", () => {
        const result = execSync(`node "${CLI_PATH}" --help`, {
            encoding: "utf8",
        })

        expect(result).toMatchSnapshot()
    })

    it("should show version", () => {
        const result = execSync(`node "${CLI_PATH}" --version`, {
            encoding: "utf8",
        })

        expect(result).toMatchSnapshot()
    })
})
