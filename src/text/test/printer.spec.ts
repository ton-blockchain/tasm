import {readFileSync} from "node:fs"
import {ADD, decompileCell, fPUSHINT, PUSHINT_4} from "../../runtime"
import {boc} from "../../runtime/util"
import {print} from "../printer"

describe("assembly-printer", () => {
  it("should print simple assembly", () => {
    const instructions = [PUSHINT_4(10), PUSHINT_4(5), ADD()]

    expect(print(instructions)).toMatchSnapshot()
  })

  it("should print assembly", () => {
    const instructions = decompileCell(
      boc(
        readFileSync(`${__dirname}/testdata/jetton_minter_discoverable_JettonMinter.boc`).toString(
          "hex",
        ),
      ).asCell(),
    )

    expect(print(instructions)).toMatchSnapshot()
  })

  it("should print simple assembly with fift instruction", () => {
    const instructions = [fPUSHINT(10n), fPUSHINT(999n), ADD()]

    expect(print(instructions)).toMatchSnapshot()
  })
})
