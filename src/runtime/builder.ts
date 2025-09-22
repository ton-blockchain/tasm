import type {Cell} from "@ton/core"
import {Builder} from "@ton/core"
import type {Instr} from "./instr-gen"
import type {Dictionary, DictionaryKeyTypes} from "../dict/Dictionary"

/**
 * Describes an instruction with its offset in the parent `Cell`.
 */
export type InstructionWithOffset = {
    readonly instr: Instr
    readonly offset: number
    readonly debugSections: readonly number[]
}

/**
 * Describes a mapping of a single `Cell` to its instructions and sub-mappings.
 *
 * This mapping is crucial for debugging, since in Sandbox logs we only have
 * a hash of the current Cell and instruction offset in it.
 */
export type Mapping = {
    /**
     * The hash of the `Cell` that is being mapped.
     */
    readonly cell: string
    /**
     * The instructions that are stored in the `Cell`.
     */
    readonly instructions: InstructionWithOffset[]
    /**
     * Instructions can store references to other cells.
     * These references are stored in this array.
     */
    readonly subMappings: readonly Mapping[]
    /**
     * When we serialize a `Dictionary`, we store additional information
     * about the position of the cell in the dictionary Cell.
     */
    readonly dictionaryInfo: readonly DictionaryInfo[]
}

/**
 * When we serialize a `Dictionary`, we store actual Cell data after some prefix.
 * If we want to map Dictionary Cell to its instructions, we need to store
 * information about which Dictionary Cell contains Cell with instructions
 * and its offset in the Dictionary Cell.
 *
 * When we parse Sandbox logs, we have a hash of the Dictionary Cell, but we actually
 * want to get the instructions, so we need this information to map the Dictionary Cell
 * to its instructions.
 */
export type DictionaryInfo = {
    /**
     * The `CodeBuilder` that builds the Dictionary Cell.
     */
    readonly builder: CodeBuilder
    /**
     * The offset of the Cell with instructions in the Dictionary Cell.
     */
    readonly offset: number
    /**
     * The `Cell` that contains the instructions.
     */
    readonly childCell: Cell
}

/**
 * Extended Builder class that stores additional debug information.
 */
export class CodeBuilder extends Builder {
    private readonly instructions: InstructionWithOffset[] = []
    private readonly subMappings: Mapping[] = []
    private readonly dictionaryInfo: DictionaryInfo[] = []
    private debugSectionIds: number[] = []

    public constructor(
        public readonly isDictionaryCell: boolean = false,
        public readonly offset: number = 0,
    ) {
        super()
    }

    public storeInstructionPrefix(value: bigint | number, bits: number, instr: Instr): this {
        this.instructions.push({instr, offset: this.bits, debugSections: [...this.debugSectionIds]})
        this.debugSectionIds = []
        return super.storeUint(value, bits)
    }

    public addImplicitRet() {
        const lastInstruction = this.instructions.at(-1)
        if (!lastInstruction) return

        // This implicit RET instruction is used as an anchor for all trailing DEBUGMARK instructions.
        this.instructions.push({
            instr: {
                $: "RET",
                loc: lastInstruction.instr.loc,
            },
            offset: lastInstruction.offset,
            debugSections: [...this.debugSectionIds],
        })
    }

    public build(): [Cell, Mapping] {
        const cell = this.asCell()
        return [
            cell,
            {
                cell: cell.hash().toString("hex"),
                instructions: this.instructions,
                subMappings: this.subMappings,
                dictionaryInfo: this.dictionaryInfo,
            },
        ]
    }

    public clearDebugSectionIds(): this {
        this.debugSectionIds = []
        return this
    }

    public startDebugSection(id: number): this {
        this.debugSectionIds.push(id)
        return this
    }

    public pushMappings(...mappings: Mapping[]): this {
        this.subMappings.push(...mappings)
        return this
    }

    public pushInstructions(...instructions: InstructionWithOffset[]): this {
        this.instructions.push(...instructions)
        return this
    }

    public getDictionaryInfo(): DictionaryInfo[] {
        return this.dictionaryInfo
    }

    public pushDictionaryInfo(...info: DictionaryInfo[]): this {
        this.dictionaryInfo.push(...info)
        return this
    }

    public storeRefWithMapping([cell, mapping]: [Cell, Mapping]): this {
        this.subMappings.push(mapping)
        return super.storeRef(cell)
    }

    public storeDictionaryDirect<K extends DictionaryKeyTypes, V>(dict: Dictionary<K, V>) {
        dict.storeDirect(this)
        return this
    }

    public canFit(bits: number): boolean {
        const maxBits = 1023 - (this.isDictionaryCell ? this.offset : 0)
        return this.bits + bits <= maxBits
    }

    public reinitFrom(other: CodeBuilder): this {
        // @ts-expect-error hack
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        this._bits = other._bits
        // @ts-expect-error hack
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        this._refs = other._refs
        this.instructions.push(...other.instructions)
        this.subMappings.push(...other.subMappings)
        this.dictionaryInfo.push(...other.dictionaryInfo)
        this.debugSectionIds = [...other.debugSectionIds]
        return this
    }
}
