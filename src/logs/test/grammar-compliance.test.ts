import {parse} from "../parse"
import * as $ from "../grammar.gen.pegjs"
import type * as G from "../grammar"

describe("Grammar Rules Compliance", () => {
    describe("vmLine rules", () => {
        test("VmLoc", () => {
            const input =
                "code cell hash: 6DB0B8EFEF2B59D53B896E2A6EBCBBEF72BE9A1F8CD2DA1D0E8EA8F57C4F8AE0 offset:2608"
            const result = $.parse(input, {startRule: "vmLine"}) as G.$ast.vmLine

            expect(result.$).toBe("VmLoc")
            if (result.$ === "VmLoc") {
                expect(typeof result.hash).toBe("string")
                expect(result.hash).toBe(
                    "6DB0B8EFEF2B59D53B896E2A6EBCBBEF72BE9A1F8CD2DA1D0E8EA8F57C4F8AE0",
                )
                expect(result.offset).toEqual({op: undefined, value: "2608"})
            }
        })

        test("VmStack", () => {
            const input = "stack: [98 100 0 101]"
            const result = $.parse(input, {startRule: "vmLine"}) as G.$ast.vmLine

            expect(result.$).toBe("VmStack")
            if (result.$ === "VmStack") {
                expect(typeof result.stack).toBe("string")
                expect(result.stack).toBe("[98 100 0 101]")
            }
        })

        test("VmExecute", () => {
            const input = "execute PUSHINT 0"
            const result = $.parse(input, {startRule: "vmLine"}) as G.$ast.vmLine

            expect(result.$).toBe("VmExecute")
            if (result.$ === "VmExecute") {
                expect(typeof result.instr).toBe("string")
                expect(result.instr).toBe("PUSHINT 0")
            }
        })

        test("VmLimitChanged", () => {
            const input = "changing gas limit to 100"
            const result = $.parse(input, {startRule: "vmLine"}) as G.$ast.vmLine

            expect(result.$).toBe("VmLimitChanged")
            if (result.$ === "VmLimitChanged") {
                expect(result.limit).toEqual({op: undefined, value: "100"})
            }
        })

        test("VmGasRemaining", () => {
            const input = "gas remaining: 999999998"
            const result = $.parse(input, {startRule: "vmLine"}) as G.$ast.vmLine

            expect(result.$).toBe("VmGasRemaining")
            if (result.$ === "VmGasRemaining") {
                expect(result.gas).toEqual({op: undefined, value: "999999998"})
            }
        })

        test("VmException", () => {
            const input = "handling exception code 2: stack underflow"
            const result = $.parse(input, {startRule: "vmLine"}) as G.$ast.vmLine

            expect(result.$).toBe("VmException")
            if (result.$ === "VmException") {
                expect(result.errno).toEqual({op: undefined, value: "2"})
                expect(typeof result.message).toBe("string")
                expect(result.message).toBe("stack underflow")
            }
        })

        test("VmExceptionHandler", () => {
            const input = "default exception handler, terminating vm with exit code 2"
            const result = $.parse(input, {startRule: "vmLine"}) as G.$ast.vmLine

            expect(result.$).toBe("VmExceptionHandler")
            if (result.$ === "VmExceptionHandler") {
                expect(result.errno).toEqual({op: undefined, value: "2"})
            }
        })

        test("VmFinalC5", () => {
            const input = "final c5:C{00000000}"
            const result = $.parse(input, {startRule: "vmLine"}) as G.$ast.vmLine

            expect(result.$).toBe("VmFinalC5")
            if (result.$ === "VmFinalC5") {
                expect(result.value).toEqual({$: "Cell", value: "00000000"})
            }
        })

        test("VmUnknown", () => {
            const input = "VM Log Message Here"
            const result = $.parse(input, {startRule: "vmLine"}) as G.$ast.vmLine

            expect(result.$).toBe("VmUnknown")
            if (result.$ === "VmUnknown") {
                expect(typeof result.text).toBe("string")
                expect(result.text).toBe("VM Log Message Here")
            }
        })
    })

    describe("Stack parsing rules", () => {
        test("VmParsedStack with simple integers", () => {
            const input = "[98 100 0]"
            const result = $.parse(input, {startRule: "VmParsedStack"}) as G.$ast.VmParsedStack

            expect(result.$).toBe("VmParsedStack")
            expect(Array.isArray(result.values)).toBe(true)
            expect(result.values).toHaveLength(3)

            // Check first value structure
            const firstValue = result.values[0]
            expect(firstValue?.$).toBe("VmStackValue")
            expect(firstValue?.value.$).toBe("Integer")
            if (firstValue?.value.$ === "Integer") {
                expect(firstValue.value.value).toEqual({op: undefined, value: "98"})
            }
        })

        test("VmParsedStack with complex types", () => {
            const input = "[98 () NaN C{DEAD} [1 2] CS{DEAD}]"
            const result = $.parse(input, {startRule: "VmParsedStack"}) as G.$ast.VmParsedStack

            expect(result.$).toBe("VmParsedStack")
            expect(Array.isArray(result.values)).toBe(true)
            expect(result.values).toHaveLength(6)

            // Check types
            const values = result.values
            expect(values[0]?.value.$).toBe("Integer")
            expect(values[1]?.value.$).toBe("Null")
            expect(values[2]?.value.$).toBe("NaN")
            expect(values[3]?.value.$).toBe("Cell")
            expect(values[4]?.value.$).toBe("Tuple")
            const fifthValue = values[5]
            expect(fifthValue?.value.$).toBe("CellSlice")
            if (
                fifthValue?.value.$ === "CellSlice" &&
                fifthValue.value.body.$ === "CellSliceShortBody"
            ) {
                expect(fifthValue.value.body.value).toBe("DEAD")
            }
        })

        test("VmParsedStack with complex types 2", () => {
            const input =
                "[ 163613525018 0 C{B5EE9C72010232010002200001DD880100024AC57E0F8D9E1198A9F947061ACEA8AE8D056AC8E185E23049670F4F6396000E1027C7AB85EBDEFF36322CF89905A64762DA99FA1014DEAF4065E7FD17730B424A0AD6492B729326938F81B89DDCA402851CF427AD2B8F308066EBE25C1012F3FC951B41C4D1380000000401024BA476C3FF447BA631C5520DC59C78171343362F8486368CEB6D197F29E530B3E2EE6B2800007002030201200405000002037BA006070201200C0D0013AD9A741281DCD6539DC002012008090201200A0B0012AA11542503B9ACA1DD0011A852184A07735943F90011A83A604A07735942410201200E0F0202702C2D02012010110201201E1F020148121302014818190013AD9A741281DCD650B240020120141502012016170012AA11542503B9ACA1160011A852184A077359487D0011A83A604A07735940BD0013AD9A741281DCD68D28C00201201A1B0201201C1D0012AA11542503B9ACA78E0011A852184A07735941F30011A83A604A0773594195020148202102014826270013AD9A741281DCD652CEC0020120222302012024250012AA11542503B9ACA36C0011A852184A07735940BF0011A83A604A077359413D0013AD9A741281DCD6510BC002012028290201202A2B0012AA11542503B9ACBC310011A852184A07735948110011A83A604A07735948390013AD9A741281DCD650B2C00201202E2F02012030310012AA11542503B9ACA3510011A852184A07735940C10011A83A604A0773594FAB} CS{B5EE9C72010232010001FD00019801C204F8F570BD7BDFE6C6459F1320B4C8EC5B533F42029BD5E80CBCFFA2EE616849415AC9256E5264D271F03713BB948050A39E84F5A571E6100CDD7C4B82025E7F92A368389A270000000001024BA476C3FF447BA631C5520DC59C78171343362F8486368CEB6D197F29E530B3E2EE6B2800007002030201200405000002037BA006070201200C0D0013AD9A741281DCD6539DC002012008090201200A0B0012AA11542503B9ACA1DD0011A852184A07735943F90011A83A604A07735942410201200E0F0202702C2D02012010110201201E1F020148121302014818190013AD9A741281DCD650B240020120141502012016170012AA11542503B9ACA1160011A852184A077359487D0011A83A604A07735940BD0013AD9A741281DCD68D28C00201201A1B0201201C1D0012AA11542503B9ACA78E0011A852184A07735941F30011A83A604A0773594195020148202102014826270013AD9A741281DCD652CEC0020120222302012024250012AA11542503B9ACA36C0011A852184A07735940BF0011A83A604A077359413D0013AD9A741281DCD6510BC002012028290201202A2B0012AA11542503B9ACBC310011A852184A07735948110011A83A604A07735948390013AD9A741281DCD650B2C00201202E2F02012030310012AA11542503B9ACA3510011A852184A07735940C10011A83A604A0773594FAB} -1 ]"
            const result = $.parse(input, {startRule: "VmParsedStack"}) as G.$ast.VmParsedStack

            expect(result).toMatchSnapshot()
        })
    })

    describe("Integration with parse.ts", () => {
        test("parse function handles all vm line types", () => {
            const testLog = `code cell hash:6DB0B8EFEF2B59D53B896E2A6EBCBBEF72BE9A1F8CD2DA1D0E8EA8F57C4F8AE0 offset:2608
stack: [98 100 0 101]
execute PUSHINT 0
gas remaining: 999999998
changing gas limit to 100
handling exception code 2: stack underflow
default exception handler, terminating vm with exit code 2
final c5:C{00000000}
VM Log Message Here`

            const result = parse(testLog)

            expect(result).toHaveLength(9)
            expect(result[0]?.$).toBe("VmLoc")
            expect(result[1]?.$).toBe("VmStack")
            expect(result[2]?.$).toBe("VmExecute")
            expect(result[3]?.$).toBe("VmGasRemaining")
            expect(result[4]?.$).toBe("VmLimitChanged")
            expect(result[5]?.$).toBe("VmException")
            expect(result[6]?.$).toBe("VmExceptionHandler")
            expect(result[7]?.$).toBe("VmFinalC5")
            expect(result[8]?.$).toBe("VmUnknown")
        })

        test("detailed type checking for parsed results", () => {
            const result = parse("final c5:C{00000000}")
            expect(result).toHaveLength(1)
            const finalC5 = result[0]

            expect(finalC5?.$).toBe("VmFinalC5")
            if (finalC5?.$ === "VmFinalC5") {
                expect(typeof finalC5.hex).toBe("string")
                expect(finalC5.hex).toBe("00000000")
            }
        })

        test("stack parsing validates structure", () => {
            const result = parse("stack: [98 () NaN C{DEAD}]")
            expect(result).toHaveLength(1)
            const stackLine = result[0]

            expect(stackLine?.$).toBe("VmStack")
            if (stackLine?.$ === "VmStack") {
                expect(Array.isArray(stackLine.stack)).toBe(true)
                expect(stackLine.stack).toHaveLength(4)

                expect(stackLine.stack[0]?.$).toBe("Integer")
                expect(stackLine.stack[1]?.$).toBe("Null")
                expect(stackLine.stack[2]?.$).toBe("NaN")
                expect(stackLine.stack[3]?.$).toBe("Cell")
            }
        })
    })
})
