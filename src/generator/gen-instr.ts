import {writeFileSync} from "node:fs"
import * as t from "@babel/types"
import generateTs from "@babel/generator"
import {fiftInstructionList, instructionList, pseudoInstructions} from "./instructions"

const CONSTRUCTORS_QUALIFIER = t.identifier("c")
const FIFT_CONSTRUCTORS_QUALIFIER = t.identifier("cf")
const UTIL_QUALIFIER = t.identifier("$")
const TYPES_QUALIFIER = t.identifier("types")
const FIFT_TYPES_QUALIFIER = t.identifier("ftypes")

const main = () => {
    writeFileSync(`${__dirname}/../runtime/instr-gen.ts`, generate())
}

const generate = (): string => {
    const importUtil = t.importDeclaration(
        [t.importNamespaceSpecifier(UTIL_QUALIFIER)],
        t.stringLiteral("./util"),
    )

    const importConstructors = t.importDeclaration(
        [t.importNamespaceSpecifier(CONSTRUCTORS_QUALIFIER)],
        t.stringLiteral("./constructors"),
    )

    const importFiftConstructors = t.importDeclaration(
        [t.importNamespaceSpecifier(FIFT_CONSTRUCTORS_QUALIFIER)],
        t.stringLiteral("./fift-instr-constructors"),
    )

    const importType = t.importDeclaration(
        [t.importNamespaceSpecifier(TYPES_QUALIFIER)],
        t.stringLiteral("./types"),
    )

    const importFiftTypes = t.importDeclaration(
        [t.importNamespaceSpecifier(FIFT_TYPES_QUALIFIER)],
        t.stringLiteral("./fift-instr"),
    )

    // export type Instr = c.CALLREF | c.ABS | c.PUSH | c.PUSHCONT | c.IF // all
    const instructions = instructionList()
    const fiftInstructions = fiftInstructionList()

    const exportType = t.exportNamedDeclaration(
        t.tsTypeAliasDeclaration(
            t.identifier("Instr"),
            undefined,
            t.tsUnionType([
                ...instructions.map(([rawName]) => {
                    const realName = rawName.startsWith("2") ? rawName.slice(1) + "2" : rawName
                    const name = realName.replace("#", "_")
                    return t.tsTypeReference(
                        t.tsQualifiedName(CONSTRUCTORS_QUALIFIER, t.identifier(name)),
                    )
                }),
                ...fiftInstructions.map(([name]) => {
                    return t.tsTypeReference(
                        t.tsQualifiedName(FIFT_CONSTRUCTORS_QUALIFIER, t.identifier(name)),
                    )
                }),
            ]),
        ),
    )

    // export const rangeToType = [{min: 0, max: 1, load: types.ABS.load}]
    const rangeToTypeConst = t.exportNamedDeclaration(
        t.variableDeclaration("const", [
            t.variableDeclarator(
                t.identifier("rangeToType"),
                t.arrayExpression(
                    instructions.flatMap(([name, opcode]) => {
                        if (pseudoInstructions.has(name)) {
                            return []
                        }
                        return [
                            t.objectExpression([
                                t.objectProperty(t.identifier("min"), t.numericLiteral(opcode.min)),
                                t.objectProperty(t.identifier("max"), t.numericLiteral(opcode.max)),
                                t.objectProperty(
                                    t.identifier("load"),
                                    t.memberExpression(
                                        t.memberExpression(TYPES_QUALIFIER, t.identifier(name)),
                                        t.identifier("load"),
                                    ),
                                ),
                            ]),
                        ]
                    }),
                ),
            ),
        ]),
    )

    // TODO: use records/makeVisitor
    // use Object.create(null) for performance
    // const storeMapping: Map<string, Store<any>> = new Map()
    const storeMappingIdent = t.identifier("storeMapping")
    storeMappingIdent.typeAnnotation = t.tsTypeAnnotation(
        t.tsTypeReference(
            t.identifier("Map"),
            t.tsTypeParameterInstantiation([
                t.tsTypeReference(t.identifier("string")),
                // $.Store<any>
                t.tsTypeReference(
                    t.tsQualifiedName(UTIL_QUALIFIER, t.identifier("Store")),
                    t.tsTypeParameterInstantiation([t.tsTypeReference(t.identifier("any"))]),
                ),
            ]),
        ),
    )

    const storeMapping = t.exportNamedDeclaration(
        t.variableDeclaration("const", [
            t.variableDeclarator(storeMappingIdent, t.newExpression(t.identifier("Map"), [])),
        ]),
    )

    // storeMapping.set("PUSHNAN", types.PUSHNAN.store)
    // storeMapping.set("ADD", types.ADD.store)
    const storeMappingEntries = [
        ...instructions.flatMap(([name]) => {
            if (pseudoInstructions.has(name)) {
                return []
            }

            return [
                t.expressionStatement(
                    t.callExpression(t.memberExpression(storeMappingIdent, t.identifier("set")), [
                        t.stringLiteral(name),
                        t.memberExpression(
                            t.memberExpression(TYPES_QUALIFIER, t.identifier(name)),
                            t.identifier("store"),
                        ),
                    ]),
                ),
            ]
        }),
        ...fiftInstructions.flatMap(([name]) => {
            return [
                t.expressionStatement(
                    t.callExpression(t.memberExpression(storeMappingIdent, t.identifier("set")), [
                        t.stringLiteral(name),
                        t.memberExpression(
                            t.memberExpression(FIFT_TYPES_QUALIFIER, t.identifier(name)),
                            t.identifier("store"),
                        ),
                    ]),
                ),
            ]
        }),
    ]

    const file = t.file(
        t.program([
            importUtil,
            importConstructors,
            importFiftConstructors,
            importType,
            importFiftTypes,
            exportType,
            rangeToTypeConst,
            storeMapping,
            ...storeMappingEntries,
        ]),
    )
    t.addComment(
        file,
        "leading",
        ` AUTOGENERATED, DO NOT EDIT, generated by ../generator/gen-instr.ts`,
        true,
    )
    return generateTs(file).code
}

main()
