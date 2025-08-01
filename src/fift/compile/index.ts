import {parse} from "../parse/parse"
import {print} from "../../text"
import type {DecompiledDict} from "../../runtime/util"
import type {Instr} from "../../runtime"
import {
    compileCell,
    decompileCell,
    DICTIGETJMPZ,
    DICTPUSHCONST,
    SETCP,
    THROWARG,
} from "../../runtime"
import {execSync} from "node:child_process"
import {existsSync, readFileSync, rmSync, writeFileSync} from "node:fs"
import {Cell} from "@ton/core"
import {diffLines} from "diff"
import {compileDefinition, processAst} from "./compile"

function compileFift(code: string) {
    if (existsSync("out.boc")) {
        rmSync("out.boc")
    }
    writeFileSync("1.fif", code + '\n\nboc>B "out.boc" B>file')
    execSync(
        "/Users/petrmakhnev/ton-tolk/cmake-build-debug/crypto/fift -I /Users/petrmakhnev/ton-tolk/crypto/fift/lib 1.fif",
    )
    return Cell.fromBoc(readFileSync("out.boc"))[0] ?? new Cell()
}

// eslint-disable-next-line @typescript-eslint/require-await
const main = async () => {
    const _ = `
    "Asm.fif" include
    // automatically generated from 1.tolk
    PROGRAM{
      DECLGLOBVAR $foo
      DECLGLOBVAR $bar
      0 DECLMETHOD onInternalMessage()
      DECLPROC foo()
      foo() PROC:<{
        ADD 
      }>
      onInternalMessage() PROC:<{
        11 PUSHINT
        0 THROWIF
        x{1} SDBEGINSQ
        IFJMP:<{
          256 PLDI
          THROWANY
        }>
        x{2} SDBEGINSQ
        IFJMP:<{
          256 LDSLICE
          DROP
          HASHSU
          THROWANY
        }>
        foo() CALLDICT
        $bar SETGLOB
        3 THROW
      }>
    }END>c
    `

    const code = readFileSync("NotcoinJettonMinter.00-FunC.fif", "utf8")

    const result = parse("test.fift", code)
    if (result.$ === "ParseFailure") {
        throw result.error
    }

    const ctx = processAst(result.ast)

    const methods = result.ast.program.definitions.map(def => {
        const definition = compileDefinition(def, ctx)
        ctx.compiledFunctions.set(def.def.name.name, definition)
        return definition.compiled
    })

    const usedMethods = methods.filter(method => {
        const func = ctx.functions.entries().find(([, id]) => method.id === id)
        if (!func) return true
        const [name] = func
        const usageCount = ctx.usedFunctions.get(name) ?? 0
        return usageCount > 0
    })

    const mainDictionary: DecompiledDict = {
        $: "DecompiledDict",
        methods: usedMethods,
    }

    const toplevel: Instr[] = [
        SETCP(0),
        DICTPUSHCONST(19, mainDictionary),
        DICTIGETJMPZ(),
        THROWARG(11),
    ]

    console.log("Raw compiled fift:")
    console.log(print(toplevel))
    const cell = compileCell(toplevel)

    const text = print(decompileCell(cell))
    console.log("TASM:\n\n", text)
    writeFileSync("out.tasm.compiled", text)

    const fiftCell = compileFift(code)
    const fiftText = print(decompileCell(fiftCell))
    console.log("Fift:\n\n", fiftText)
    writeFileSync("out.fif.compiled", fiftText)

    if (cell.toString() !== fiftCell.toString()) {
        console.log(diffLines(cell.toString(), fiftCell.toString()))
        console.log(diffLines(text, fiftText))
        throw new Error("Mismatch with Fift")
    }

    console.log("Compilation succeed")
}

void main()
