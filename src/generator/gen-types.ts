import {writeFileSync} from "node:fs"
import * as t from "@babel/types"
import type * as $ from "./instructions"
import {instructionList, pseudoInstructions} from "./instructions"
import generateTs from "@babel/generator"

const CONSTRUCTORS_QUALIFIER = t.identifier("c")
const UTIL_QUALIFIER = t.identifier("$")

const main = () => {
    writeFileSync(`${__dirname}/../runtime/types.ts`, generate())
}

const SUFFIX = `export const DEBUGMARK: $.Type<c.DEBUGMARK> = {
    load: s => {
        s.skip(16)
        return c.DEBUGMARK($.uint(16).load(s))
    },
    store: (b, val) => {
        b.startDebugSection(val.arg0)
    },
}
`

const generate = (): string => {
    const importUtil = t.importDeclaration(
        [t.importNamespaceSpecifier(UTIL_QUALIFIER)],
        t.stringLiteral("./util"),
    )

    const importConstructors = t.importDeclaration(
        [t.importNamespaceSpecifier(CONSTRUCTORS_QUALIFIER)],
        t.stringLiteral("./constructors"),
    )

    const stmts = instructionList().flatMap(([name, instruction]) => {
        if (pseudoInstructions.has(name) || name === "DEBUGMARK") {
            return []
        }
        return generateOpcode(name, instruction)
    })

    const file = t.file(t.program([importUtil, importConstructors, ...stmts]))
    t.addComment(
        file,
        "leading",
        ` AUTOGENERATED, DO NOT EDIT, generated by ../generator/gen-types.ts\n// noinspection JSUnusedLocalSymbols`,
        true,
    )
    return generateTs(file).code + SUFFIX
}

const wrapIntoLoad = (expr: t.Expression) =>
    t.callExpression(t.memberExpression(expr, t.identifier("load")), [t.identifier("s")])

const wrapIntoStore = (name: string, expr: t.Expression) =>
    t.expressionStatement(
        t.callExpression(t.memberExpression(expr, t.identifier("store")), [
            t.identifier("b"),
            t.memberExpression(t.identifier("val"), t.identifier(name)),
            t.identifier("options"),
        ]),
    )

const wrapIntoArrayStore = (names: string[], expr: t.Expression) =>
    t.expressionStatement(
        t.callExpression(t.memberExpression(expr, t.identifier("store")), [
            t.identifier("b"),
            t.arrayExpression(
                names.map(name => {
                    return t.memberExpression(t.identifier("val"), t.identifier(name))
                }),
            ),
            t.identifier("options"),
        ]),
    )

const generateOpcodeFields = (name: string, instruction: $.Opcode) => {
    return [
        t.objectProperty(
            // load: (s) => {
            //     s.skip(8)
            //     return c.PUSH($.uint(4).load(s))
            // }
            t.identifier("load"),
            t.arrowFunctionExpression(
                [t.identifier("s")],
                t.blockStatement([
                    t.expressionStatement(
                        t.callExpression(
                            t.memberExpression(t.identifier("s"), t.identifier("skip")),
                            [t.numericLiteral(instruction.checkLen)],
                        ),
                    ),
                    t.returnStatement(
                        t.callExpression(
                            t.memberExpression(CONSTRUCTORS_QUALIFIER, t.identifier(name)),
                            generateLoadArgs(instruction.args),
                        ),
                    ),
                ]),
            ),
        ),
        t.objectProperty(
            // store: (b) => b.storeUint(0x100, 8),
            t.identifier("store"),
            t.arrowFunctionExpression(
                [t.identifier("b"), t.identifier("val"), t.identifier("options")],
                t.blockStatement([
                    t.expressionStatement(
                        t.callExpression(
                            t.memberExpression(
                                t.identifier("b"),
                                t.identifier("storeInstructionPrefix"),
                            ),
                            [
                                instruction.kind === "fixed-range" ||
                                instruction.kind === "ext-range"
                                    ? t.binaryExpression(
                                          ">>",
                                          t.numericLiteral(instruction.prefix),
                                          t.numericLiteral(
                                              instruction.skipLen - instruction.checkLen,
                                          ),
                                      )
                                    : t.numericLiteral(instruction.prefix),
                                t.numericLiteral(instruction.checkLen),
                                t.identifier("val"),
                            ],
                        ),
                    ),
                    ...generateStoreArgs(instruction.args),
                ]),
            ),
        ),
    ]
}

const generateOpcode = (name: string, instruction: $.Opcode): t.Statement[] => {
    const nameIdent = t.identifier(name)
    nameIdent.typeAnnotation = t.tsTypeAnnotation(
        t.tsTypeReference(
            t.tsQualifiedName(UTIL_QUALIFIER, t.identifier("Type")),
            t.tsTypeParameterInstantiation([
                t.tsTypeReference(t.tsQualifiedName(CONSTRUCTORS_QUALIFIER, t.identifier(name))),
            ]),
        ),
    )

    const constructor = t.exportNamedDeclaration(
        t.variableDeclaration("const", [
            t.variableDeclarator(
                nameIdent,
                t.objectExpression(generateOpcodeFields(name, instruction)),
            ),
        ]),
    )

    return [constructor]
}

const generateLoadArgs = (args: $.args): (t.Expression | t.SpreadElement)[] => {
    switch (args.$) {
        case "simpleArgs":
            return generateSimpleArgs(args).map(arg => wrapIntoLoad(arg))
        case "xchgArgs":
            return generateXchgArgs(args).map(arg => wrapIntoLoad(arg))
        case "dictpush":
            return generateDictpush(args).map(arg => t.spreadElement(wrapIntoLoad(arg)))
    }

    throw new Error("Unexpected arg type")
}

const generateStoreArgs = (args: $.args): t.Statement[] => {
    switch (args.$) {
        case "simpleArgs":
            return generateSimpleArgs(args).map((arg, index) => wrapIntoStore(`arg${index}`, arg))
        case "xchgArgs":
            return generateXchgArgs(args).map((arg, index) => wrapIntoStore(`arg${index}`, arg))
        case "dictpush":
            return [
                wrapIntoArrayStore(
                    ["arg0", "arg1"],
                    t.memberExpression(UTIL_QUALIFIER, t.identifier("dictpush")),
                ),
            ]
    }

    throw new Error("Unexpected arg type")
}

// uint(4), uint(4)
const generateXchgArgs = (_args: $.xchgArgs): t.Expression[] => {
    return [
        t.callExpression(t.memberExpression(UTIL_QUALIFIER, t.identifier("uint")), [
            t.numericLiteral(4),
        ]),
        t.callExpression(t.memberExpression(UTIL_QUALIFIER, t.identifier("uint")), [
            t.numericLiteral(4),
        ]),
    ]
}

// codeSlice(uint(2), uint(7))
const generateCodeSlice = (args: $.codeSlice): t.Expression => {
    return t.callExpression(t.memberExpression(UTIL_QUALIFIER, t.identifier("codeSlice")), [
        generateArg(args.refs),
        generateArg(args.bits),
    ])
}

const generateInlineCodeSlice = (args: $.inlineCodeSlice): t.Expression => {
    return t.callExpression(t.memberExpression(UTIL_QUALIFIER, t.identifier("inlineCodeSlice")), [
        generateArg(args.bits),
    ])
}

const generateSlice = (args: $.slice): t.Expression => {
    return t.callExpression(t.memberExpression(UTIL_QUALIFIER, t.identifier("slice")), [
        generateArg(args.refs),
        generateArg(args.bits),
        t.numericLiteral(args.pad),
    ])
}

const generateDictpush = (_args: $.dictpush): t.Expression[] => {
    return [t.memberExpression(UTIL_QUALIFIER, t.identifier("dictpush"))]
}

const generateSimpleArgs = (args: $.simpleArgs): t.Expression[] =>
    args.children.map(arg => generateArg(arg))

function generateTypeDescription(name: string, arg: number) {
    return t.callExpression(t.memberExpression(UTIL_QUALIFIER, t.identifier(name)), [
        t.numericLiteral(arg),
    ])
}

const generateArg = (arg: $.arg): t.Expression => {
    switch (arg.$) {
        case "int":
            return generateTypeDescription("int", arg.len)
        case "uint":
            return generateTypeDescription("uint", arg.len)
        case "refs":
            return generateTypeDescription("refs", arg.count)
        case "stack":
            return generateTypeDescription("uint", arg.len)
        case "control":
            return t.memberExpression(UTIL_QUALIFIER, t.identifier("control"))
        case "plduzArg":
            return t.memberExpression(UTIL_QUALIFIER, t.identifier("plduzArg"))
        case "tinyInt":
            return t.memberExpression(UTIL_QUALIFIER, t.identifier("tinyInt"))
        case "largeInt":
            return t.memberExpression(UTIL_QUALIFIER, t.identifier("largeInt"))
        case "runvmArg":
            return t.memberExpression(UTIL_QUALIFIER, t.identifier("runvmArg"))
        case "minusOne":
            return t.memberExpression(UTIL_QUALIFIER, t.identifier("minusOne"))
        case "s1":
            return t.memberExpression(UTIL_QUALIFIER, t.identifier("s1"))
        case "setcpArg":
            return t.memberExpression(UTIL_QUALIFIER, t.identifier("setcpArg"))
        case "delta":
            return t.callExpression(t.memberExpression(UTIL_QUALIFIER, t.identifier("delta")), [
                t.numericLiteral(arg.delta),
                generateArg(arg.arg),
            ])
        case "hash":
            return t.memberExpression(UTIL_QUALIFIER, t.identifier("hash"))
        case "codeSlice":
            return generateCodeSlice(arg)
        case "refCodeSlice":
            return t.memberExpression(UTIL_QUALIFIER, t.identifier("refCodeSlice"))
        case "exoticCell":
            return t.callExpression(
                t.memberExpression(UTIL_QUALIFIER, t.identifier("exoticCell")),
                [],
            )
        case "debugstr":
            return t.memberExpression(UTIL_QUALIFIER, t.identifier("debugstr"))
        case "inlineCodeSlice":
            return generateInlineCodeSlice(arg)
        case "slice":
            return generateSlice(arg)
    }

    throw new Error("Unexpected arg type")
}

main()
