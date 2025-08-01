import * as $ from "./util"
import * as G from "@ton/core"
import * as c from "./constructors"
import {PSEUDO_EXOTIC} from "./constructors"
import type {Instr} from "./instr-gen"
import {rangeToType, storeMapping} from "./instr-gen"
import type {Mapping} from "./builder"
import {CodeBuilder} from "./builder"
import {compileInstructions} from "./compile"
import type {StoreOptions} from "./util"

export const instr: $.Type<Instr> = {
    store: (b, t, options) => {
        if (t.$ === "PSEUDO_PUSHREF") {
            $.PSEUDO_PUSHREF.store(b, t, options)
            return
        }
        if (t.$ === "PSEUDO_PUSHSLICE") {
            $.PSEUDO_PUSHSLICE.store(b, t, options)
            return
        }
        if (t.$ === "PSEUDO_EXOTIC") {
            $.PSEUDO_EXOTIC.store(b, t, options)
            return
        }

        const store = storeMapping.get(t.$)
        if (!store) {
            throw new Error("unknown instruction")
        }
        store(b, t, options)
    },
    load: getLoadInstr<Instr>(rangeToType),
}

export type codeType = Instr[]

export const codeType = (): $.Type<codeType> => {
    const processCell = (cell: G.Cell): Instr[] => {
        if (cell.isExotic) {
            return [parseExotic(cell)]
        }

        return codeType().load(cell.asSlice())
    }
    return {
        load: slice => {
            const arr: Instr[] = []

            const sliceBackup = slice.clone()

            while (slice.remainingBits > 0) {
                try {
                    arr.push(instr.load(slice))
                } catch {
                    return [c.PSEUDO_PUSHSLICE(sliceBackup)]
                }
            }

            while (slice.remainingRefs > 0) {
                const source = slice.loadRef()
                const instructions = processCell(source)
                arr.push(c.PSEUDO_PUSHREF($.decompiledCode(instructions)))
            }

            return arr
        },
        store(b, t, options) {
            compileInstructions(b, t, options)
        },
    }
}

type Range<T> = {
    min: number
    max: number
    load: $.Load<T>
}

function DummyOpcode(min: number, max: number): Range<never> {
    return {
        min,
        max,
        load: s => {
            throw new Error(`invalid opcode, slice: ${s.asCell().toString()}`)
        },
    }
}

function getLoadInstr<T>(instructionList: Range<T>[]) {
    const list: Range<T>[] = []

    const MAX_OPCODE_BITS = 24

    const top_opcode = 1 << MAX_OPCODE_BITS
    const sorted = instructionList.sort((a, b) => a.min - b.min)

    let upto = 0
    for (const instruction of sorted) {
        const {min, max} = instruction

        if (min === max && min === 0) continue // skip pseudo instructions

        assert(min < max)
        assert(min >= upto)
        assert(max <= top_opcode)
        if (upto < min) {
            list.push(DummyOpcode(upto, min))
        }
        list.push(instruction)
        upto = max
    }

    if (upto < top_opcode) {
        list.push(DummyOpcode(upto, top_opcode))
    }

    return (s: G.Slice) => {
        const bits = Math.min(s.remainingBits, 24)
        const opcode = s.preloadUint(bits) << (24 - bits)

        let i = 0
        let j = list.length
        while (j - i > 1) {
            const k = (j + i) >> 1
            const kElement = list[k]
            if (kElement === undefined) break
            if (kElement.min <= opcode) {
                i = k
            } else {
                j = k
            }
        }

        const instr = list[i]

        if (bits < 8) {
            throw new Error(
                `invalid opcode, not enough bits, expected at least 8 bits, but got ${bits}`,
            )
        }

        if (!instr) {
            throw new Error(`invalid opcode, slice: ${s.asCell().toString()}`)
        }

        return instr.load(s)
    }
}

export const parseExotic = (cell: G.Cell): Instr => {
    const slice = cell.beginParse(true)
    return PSEUDO_EXOTIC($.exotic.load(slice))
}

export const DEFAULT_STORE_OPTIONS: StoreOptions = {skipRefs: false}

export const compile = (
    instructions: Instr[],
    options: StoreOptions = DEFAULT_STORE_OPTIONS,
): Buffer => {
    return compileCell(instructions, options).toBoc()
}

export const compileCell = (
    instructions: Instr[],
    options: StoreOptions = DEFAULT_STORE_OPTIONS,
): G.Cell => {
    const b = new CodeBuilder()
    codeType().store(b, instructions, options)
    return b.asCell()
}

export const compileCellWithMapping = (
    instructions: Instr[],
    options: StoreOptions = DEFAULT_STORE_OPTIONS,
    isDictionaryCell: boolean = false,
    offset: number = 0,
): [G.Cell, Mapping] => {
    const b = new CodeBuilder(isDictionaryCell, offset)
    codeType().store(b, instructions, options)
    return b.build()
}

export const decompile = (buffer: Buffer): Instr[] => {
    const boc = G.Cell.fromBoc(buffer)[0]
    if (!boc) return []
    return decompileCell(boc)
}

export const decompileCell = (cell: G.Cell): Instr[] => {
    if (cell.isExotic) {
        return [parseExotic(cell)]
    }
    return codeType().load(cell.asSlice())
}

function assert(cond: boolean) {
    if (!cond) {
        throw new Error("assertion failed")
    }
}
