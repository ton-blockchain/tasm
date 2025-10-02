import type {DictionaryInfo, Mapping} from "../runtime"
import type {Loc as InstrLoc} from "../runtime/util"
import type {
    AssemblyMapping,
    CellHash,
    CellRepresentation,
    InstructionInfo,
    Loc,
} from "ton-source-map"

export const fromParserLoc = (loc: InstrLoc): Loc => ({
    file: loc.file,
    line: loc.line,
    otherLines: [],
})

/**
 * Describes mapping of a Cell to its instructions.
 */
export type CellsMapping = Record<CellHash, undefined | CellRepresentation>

const processMapping = (mapping: Mapping, cells: CellsMapping) => {
    const previousData = cells[mapping.cell]

    if (previousData !== undefined) {
        // If we already have this cell in the mapping, we need to merge its
        // instructions with the existing ones.
        // This can happen if we have multiple instructions pointing to the same cell.

        for (const [index, instr] of mapping.instructions.entries()) {
            const line = instr.instr.loc?.line
            const instructionInfo = previousData.instructions.at(index)
            if (line !== undefined && instructionInfo !== undefined) {
                instructionInfo.loc?.otherLines.push(line)
            }
        }
        return
    }

    const instructions = mapping.instructions.map(
        ({instr: {$: name, loc}, offset, debugSections}): InstructionInfo => ({
            name,
            loc: loc ? fromParserLoc(loc) : undefined,
            offset,
            debugSections,
        }),
    )

    cells[mapping.cell] = {instructions}
}

const buildCellsMapping = (mapping: Mapping, cells: CellsMapping) => {
    const dictionaryInfos: DictionaryInfo[] = [...mapping.dictionaryInfo]
    processMapping(mapping, cells)

    for (const subMapping of mapping.subMappings) {
        processMapping(subMapping, cells)
        for (const it of subMapping.subMappings) {
            dictionaryInfos.push(...buildCellsMapping(it, cells))
        }
    }
    return dictionaryInfos
}

/**
 * Creates a mapping of all cells to their instructions.
 */
export const createMappingInfo = (m: Mapping): AssemblyMapping => {
    const cells: CellsMapping = {}

    const dictionaryInfos = buildCellsMapping(m, cells)

    return {
        dictionaryCells: dictionaryInfos.map(it => ({
            cell: it.builder.asCell().hash().toString("hex"),
            offset: it.offset,
            dataCell: it.childCell.hash().toString("hex"),
        })),
        cells: cells,
    }
}
