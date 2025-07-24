/* Generated. Do not edit. */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @typescript-eslint/no-duplicate-type-constituents */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as $ from "@tonstudio/parser-runtime"
export namespace $ast {
    export type SourceFile = $.Located<{
        readonly $: "SourceFile"
        readonly include: IncludeDirective | undefined
        readonly program: Program
    }>
    export type IncludeDirective = $.Located<{
        readonly $: "IncludeDirective"
        readonly path: string
    }>
    export type Program = $.Located<{
        readonly $: "Program"
        readonly declarations: readonly Declaration[]
        readonly definitions: readonly Definition[]
    }>
    export type Declaration = $.Located<{
        readonly $: "Declaration"
        readonly decl: ProcDeclaration | MethodDeclaration | GlobalVar
    }>
    export type ProcDeclaration = $.Located<{
        readonly $: "ProcDeclaration"
        readonly name: Identifier
    }>
    export type MethodDeclaration = $.Located<{
        readonly $: "MethodDeclaration"
        readonly method_id: Number
        readonly name: Identifier
    }>
    export type GlobalVar = $.Located<{
        readonly $: "GlobalVar"
        readonly name: Identifier
    }>
    export type Definition = $.Located<{
        readonly $: "Definition"
        readonly def: ProcDefinition | ProcInlineDefinition | ProcRefDefinition | MethodDefinition
    }>
    export type ProcDefinition = $.Located<{
        readonly $: "ProcDefinition"
        readonly name: Identifier
        readonly instructions: readonly Instruction[]
    }>
    export type ProcInlineDefinition = $.Located<{
        readonly $: "ProcInlineDefinition"
        readonly name: Identifier
        readonly instructions: readonly Instruction[]
    }>
    export type ProcRefDefinition = $.Located<{
        readonly $: "ProcRefDefinition"
        readonly name: Identifier
        readonly instructions: readonly Instruction[]
    }>
    export type MethodDefinition = $.Located<{
        readonly $: "MethodDefinition"
        readonly name: Identifier
        readonly instructions: readonly Instruction[]
    }>
    export type Instruction = $.Located<{
        readonly $: "Instruction"
    }>
    export type IfStatement = $.Located<{
        readonly $: "IfStatement"
        readonly instructions: readonly Instruction[]
        readonly else_block:
            | {
                  readonly instructions: readonly Instruction[]
              }
            | undefined
    }>
    export type IfjmpStatement = $.Located<{
        readonly $: "IfjmpStatement"
        readonly instructions: readonly Instruction[]
    }>
    export type WhileStatement = $.Located<{
        readonly $: "WhileStatement"
        readonly condition: readonly Instruction[]
        readonly body: readonly Instruction[]
    }>
    export type RepeatStatement = $.Located<{
        readonly $: "RepeatStatement"
        readonly instructions: readonly Instruction[]
    }>
    export type UntilStatement = $.Located<{
        readonly $: "UntilStatement"
        readonly instructions: readonly Instruction[]
    }>
    export type ProcCall = $.Located<{
        readonly $: "ProcCall"
        readonly proc: Identifier
        readonly call_type: keyword<"CALLDICT"> | keyword<"INLINECALLDICT">
    }>
    export type InstructionBlock = $.Located<{
        readonly $: "InstructionBlock"
        readonly instructions: readonly Instruction[]
    }>
    export type SliceLiteral = $.Located<{
        readonly $: "SliceLiteral"
    }>
    export type HexLiteral = $.Located<{
        readonly $: "HexLiteral"
    }>
    export type idPart = string | string | string | "$" | "_" | "%" | "?"
    export type Identifier = $.Located<{
        readonly $: "Identifier"
        readonly name: string
    }>
    export type NegativeIdentifier = $.Located<{
        readonly $: "NegativeIdentifier"
        readonly identifier: Identifier
    }>
    export type Number = $.Located<{
        readonly $: "Number"
    }>
    export type StackRef = $.Located<{
        readonly $: "StackRef"
        readonly index: string
    }>
    export type StackOp = $.Located<{
        readonly $: "StackOp"
        readonly first: StackIndex
        readonly second: StackIndex
        readonly operation: Identifier
    }>
    export type StackIndex = $.Located<{
        readonly $: "StackIndex"
        readonly index: string
    }>
    export type String = $.Located<{
        readonly $: "String"
        readonly content: string
    }>
    export type keyword<T> = T
    export type reservedWord = keyword<
        | "PROGRAM"
        | "END>c"
        | "DECLPROC"
        | "DECLMETHOD"
        | "DECLGLOBVAR"
        | "PROC:<{"
        | "PROCINLINE:<{"
        | "PROCREF:<{"
        | "METHOD:<{"
        | "IF:<{"
        | "ELSE<{"
        | "IFJMP:<{"
        | "WHILE:<{"
        | "DO<{"
        | "REPEAT:<{"
        | "UNTIL:<{"
        | "CALLDICT"
        | "INLINECALLDICT"
    >
    export type comment = {}
    export type space = " " | "\t" | "\r" | "\n" | comment
}
export const SourceFile: $.Parser<$ast.SourceFile> = $.loc(
    $.field(
        $.pure("SourceFile"),
        "$",
        $.field(
            $.opt($.lazy(() => IncludeDirective)),
            "include",
            $.field(
                $.lazy(() => Program),
                "program",
                $.eps,
            ),
        ),
    ),
)
export const IncludeDirective: $.Parser<$ast.IncludeDirective> = $.loc(
    $.field(
        $.pure("IncludeDirective"),
        "$",
        $.right(
            $.str('"'),
            $.field(
                $.stry($.plus($.regex<'"'>('^"', $.negateExps([$.ExpString('"')])))),
                "path",
                $.right($.str('"'), $.right($.str("include"), $.eps)),
            ),
        ),
    ),
)
export const Program: $.Parser<$ast.Program> = $.loc(
    $.field(
        $.pure("Program"),
        "$",
        $.right(
            $.lazy(() => keyword($.str("PROGRAM{"))),
            $.field(
                $.star($.lazy(() => Declaration)),
                "declarations",
                $.field(
                    $.star($.lazy(() => Definition)),
                    "definitions",
                    $.right(
                        $.lazy(() => keyword($.str("}END>c"))),
                        $.eps,
                    ),
                ),
            ),
        ),
    ),
)
export const Declaration: $.Parser<$ast.Declaration> = $.loc(
    $.field(
        $.pure("Declaration"),
        "$",
        $.field(
            $.alt(
                $.lazy(() => ProcDeclaration),
                $.alt(
                    $.lazy(() => MethodDeclaration),
                    $.lazy(() => GlobalVar),
                ),
            ),
            "decl",
            $.eps,
        ),
    ),
)
export const ProcDeclaration: $.Parser<$ast.ProcDeclaration> = $.loc(
    $.field(
        $.pure("ProcDeclaration"),
        "$",
        $.right(
            $.lazy(() => keyword($.str("DECLPROC"))),
            $.field(
                $.lazy(() => Identifier),
                "name",
                $.eps,
            ),
        ),
    ),
)
export const MethodDeclaration: $.Parser<$ast.MethodDeclaration> = $.loc(
    $.field(
        $.pure("MethodDeclaration"),
        "$",
        $.field(
            $.lazy(() => Number),
            "method_id",
            $.right(
                $.lazy(() => keyword($.str("DECLMETHOD"))),
                $.field(
                    $.lazy(() => Identifier),
                    "name",
                    $.eps,
                ),
            ),
        ),
    ),
)
export const GlobalVar: $.Parser<$ast.GlobalVar> = $.loc(
    $.field(
        $.pure("GlobalVar"),
        "$",
        $.right(
            $.lazy(() => keyword($.str("DECLGLOBVAR"))),
            $.field(
                $.lazy(() => Identifier),
                "name",
                $.eps,
            ),
        ),
    ),
)
export const Definition: $.Parser<$ast.Definition> = $.loc(
    $.field(
        $.pure("Definition"),
        "$",
        $.field(
            $.alt(
                $.lazy(() => ProcDefinition),
                $.alt(
                    $.lazy(() => ProcInlineDefinition),
                    $.alt(
                        $.lazy(() => ProcRefDefinition),
                        $.lazy(() => MethodDefinition),
                    ),
                ),
            ),
            "def",
            $.eps,
        ),
    ),
)
export const ProcDefinition: $.Parser<$ast.ProcDefinition> = $.loc(
    $.field(
        $.pure("ProcDefinition"),
        "$",
        $.field(
            $.lazy(() => Identifier),
            "name",
            $.right(
                $.lazy(() => keyword($.str("PROC:<{"))),
                $.field(
                    $.star($.lazy(() => Instruction)),
                    "instructions",
                    $.right(
                        $.lazy(() => keyword($.str("}>"))),
                        $.eps,
                    ),
                ),
            ),
        ),
    ),
)
export const ProcInlineDefinition: $.Parser<$ast.ProcInlineDefinition> = $.loc(
    $.field(
        $.pure("ProcInlineDefinition"),
        "$",
        $.field(
            $.lazy(() => Identifier),
            "name",
            $.right(
                $.lazy(() => keyword($.str("PROCINLINE:<{"))),
                $.field(
                    $.star($.lazy(() => Instruction)),
                    "instructions",
                    $.right(
                        $.lazy(() => keyword($.str("}>"))),
                        $.eps,
                    ),
                ),
            ),
        ),
    ),
)
export const ProcRefDefinition: $.Parser<$ast.ProcRefDefinition> = $.loc(
    $.field(
        $.pure("ProcRefDefinition"),
        "$",
        $.field(
            $.lazy(() => Identifier),
            "name",
            $.right(
                $.lazy(() => keyword($.str("PROCREF:<{"))),
                $.field(
                    $.star($.lazy(() => Instruction)),
                    "instructions",
                    $.right(
                        $.lazy(() => keyword($.str("}>"))),
                        $.eps,
                    ),
                ),
            ),
        ),
    ),
)
export const MethodDefinition: $.Parser<$ast.MethodDefinition> = $.loc(
    $.field(
        $.pure("MethodDefinition"),
        "$",
        $.field(
            $.lazy(() => Identifier),
            "name",
            $.right(
                $.lazy(() => keyword($.str("METHOD:<{"))),
                $.field(
                    $.star($.lazy(() => Instruction)),
                    "instructions",
                    $.right(
                        $.lazy(() => keyword($.str("}>"))),
                        $.eps,
                    ),
                ),
            ),
        ),
    ),
)
export const Instruction: $.Parser<$ast.Instruction> = $.loc(
    $.field(
        $.pure("Instruction"),
        "$",
        $.right(
            $.alt(
                $.lazy(() => NegativeIdentifier),
                $.alt(
                    $.lazy(() => Number),
                    $.alt(
                        $.lazy(() => String),
                        $.alt(
                            $.lazy(() => IfStatement),
                            $.alt(
                                $.lazy(() => IfjmpStatement),
                                $.alt(
                                    $.lazy(() => WhileStatement),
                                    $.alt(
                                        $.lazy(() => RepeatStatement),
                                        $.alt(
                                            $.lazy(() => UntilStatement),
                                            $.alt(
                                                $.lazy(() => ProcCall),
                                                $.alt(
                                                    $.lazy(() => SliceLiteral),
                                                    $.alt(
                                                        $.lazy(() => HexLiteral),
                                                        $.alt(
                                                            $.lazy(() => StackRef),
                                                            $.alt(
                                                                $.lazy(() => StackOp),
                                                                $.alt(
                                                                    $.lazy(() => InstructionBlock),
                                                                    $.lazy(() => Identifier),
                                                                ),
                                                            ),
                                                        ),
                                                    ),
                                                ),
                                            ),
                                        ),
                                    ),
                                ),
                            ),
                        ),
                    ),
                ),
            ),
            $.eps,
        ),
    ),
)
export const IfStatement: $.Parser<$ast.IfStatement> = $.loc(
    $.field(
        $.pure("IfStatement"),
        "$",
        $.right(
            $.str("IF:<{"),
            $.field(
                $.star(Instruction),
                "instructions",
                $.right(
                    $.str("}>"),
                    $.field(
                        $.opt(
                            $.right(
                                $.str("ELSE<{"),
                                $.field(
                                    $.star(Instruction),
                                    "instructions",
                                    $.right($.str("}>"), $.eps),
                                ),
                            ),
                        ),
                        "else_block",
                        $.eps,
                    ),
                ),
            ),
        ),
    ),
)
export const IfjmpStatement: $.Parser<$ast.IfjmpStatement> = $.loc(
    $.field(
        $.pure("IfjmpStatement"),
        "$",
        $.right(
            $.str("IFJMP:<{"),
            $.field($.star(Instruction), "instructions", $.right($.str("}>"), $.eps)),
        ),
    ),
)
export const WhileStatement: $.Parser<$ast.WhileStatement> = $.loc(
    $.field(
        $.pure("WhileStatement"),
        "$",
        $.right(
            $.str("WHILE:<{"),
            $.field(
                $.star(Instruction),
                "condition",
                $.right(
                    $.str("}>DO<{"),
                    $.field($.star(Instruction), "body", $.right($.str("}>"), $.eps)),
                ),
            ),
        ),
    ),
)
export const RepeatStatement: $.Parser<$ast.RepeatStatement> = $.loc(
    $.field(
        $.pure("RepeatStatement"),
        "$",
        $.right(
            $.str("REPEAT:<{"),
            $.field($.star(Instruction), "instructions", $.right($.str("}>"), $.eps)),
        ),
    ),
)
export const UntilStatement: $.Parser<$ast.UntilStatement> = $.loc(
    $.field(
        $.pure("UntilStatement"),
        "$",
        $.right(
            $.str("UNTIL:<{"),
            $.field($.star(Instruction), "instructions", $.right($.str("}>"), $.eps)),
        ),
    ),
)
export const ProcCall: $.Parser<$ast.ProcCall> = $.loc(
    $.field(
        $.pure("ProcCall"),
        "$",
        $.field(
            $.lazy(() => Identifier),
            "proc",
            $.field(
                $.alt(
                    $.lazy(() => keyword($.str("CALLDICT"))),
                    $.lazy(() => keyword($.str("INLINECALLDICT"))),
                ),
                "call_type",
                $.eps,
            ),
        ),
    ),
)
export const InstructionBlock: $.Parser<$ast.InstructionBlock> = $.loc(
    $.field(
        $.pure("InstructionBlock"),
        "$",
        $.right(
            $.str("<{"),
            $.field($.star(Instruction), "instructions", $.right($.str("}>"), $.eps)),
        ),
    ),
)
export const SliceLiteral: $.Parser<$ast.SliceLiteral> = $.loc(
    $.field(
        $.pure("SliceLiteral"),
        "$",
        $.right(
            $.alt(
                $.right(
                    $.str("b{"),
                    $.field(
                        $.stry(
                            $.plus($.regex<"0" | "1">("01", [$.ExpString("0"), $.ExpString("1")])),
                        ),
                        "content",
                        $.right($.str("}"), $.eps),
                    ),
                ),
                $.alt(
                    $.right(
                        $.str("x{"),
                        $.field(
                            $.stry(
                                $.plus(
                                    $.regex<string | string | string | "_">("0-9a-fA-F_", [
                                        $.ExpRange("0", "9"),
                                        $.ExpRange("a", "f"),
                                        $.ExpRange("A", "F"),
                                        $.ExpString("_"),
                                    ]),
                                ),
                            ),
                            "content",
                            $.right($.str("}"), $.eps),
                        ),
                    ),
                    $.right(
                        $.str("B{"),
                        $.field(
                            $.stry(
                                $.plus(
                                    $.regex<string | string | string | "_">("0-9a-fA-F_", [
                                        $.ExpRange("0", "9"),
                                        $.ExpRange("a", "f"),
                                        $.ExpRange("A", "F"),
                                        $.ExpString("_"),
                                    ]),
                                ),
                            ),
                            "content",
                            $.right($.str("}"), $.eps),
                        ),
                    ),
                ),
            ),
            $.eps,
        ),
    ),
)
export const HexLiteral: $.Parser<$ast.HexLiteral> = $.loc(
    $.field(
        $.pure("HexLiteral"),
        "$",
        $.right(
            $.stry(
                $.right(
                    $.str("0"),
                    $.right(
                        $.regex<"x" | "X">("xX", [$.ExpString("x"), $.ExpString("X")]),
                        $.right(
                            $.plus(
                                $.regex<string | string | string>("0-9a-fA-F", [
                                    $.ExpRange("0", "9"),
                                    $.ExpRange("a", "f"),
                                    $.ExpRange("A", "F"),
                                ]),
                            ),
                            $.eps,
                        ),
                    ),
                ),
            ),
            $.eps,
        ),
    ),
)
export const idPart: $.Parser<$ast.idPart> = $.named(
    "identifier character",
    $.regex<string | string | string | "$" | "_" | "%" | "?">("a-zA-Z0-9$_%?", [
        $.ExpRange("a", "z"),
        $.ExpRange("A", "Z"),
        $.ExpRange("0", "9"),
        $.ExpString("$"),
        $.ExpString("_"),
        $.ExpString("%"),
        $.ExpString("?"),
    ]),
)
export const Identifier: $.Parser<$ast.Identifier> = $.named(
    "identifier",
    $.loc(
        $.field(
            $.pure("Identifier"),
            "$",
            $.field(
                $.lex(
                    $.stry(
                        $.right(
                            $.lookNeg($.lazy(() => reservedWord)),
                            $.right(
                                $.regex<string | string | "$" | "_" | "%" | "?">("a-zA-Z$_%?", [
                                    $.ExpRange("a", "z"),
                                    $.ExpRange("A", "Z"),
                                    $.ExpString("$"),
                                    $.ExpString("_"),
                                    $.ExpString("%"),
                                    $.ExpString("?"),
                                ]),
                                $.right($.star(idPart), $.eps),
                            ),
                        ),
                    ),
                ),
                "name",
                $.eps,
            ),
        ),
    ),
)
export const NegativeIdentifier: $.Parser<$ast.NegativeIdentifier> = $.loc(
    $.field(
        $.pure("NegativeIdentifier"),
        "$",
        $.right($.str("-"), $.field(Identifier, "identifier", $.eps)),
    ),
)
export const Number: $.Parser<$ast.Number> = $.loc(
    $.field(
        $.pure("Number"),
        "$",
        $.right(
            $.stry(
                $.right(
                    $.opt($.str("-")),
                    $.right($.plus($.regex<string>("0-9", [$.ExpRange("0", "9")])), $.eps),
                ),
            ),
            $.eps,
        ),
    ),
)
export const StackRef: $.Parser<$ast.StackRef> = $.loc(
    $.field(
        $.pure("StackRef"),
        "$",
        $.right(
            $.str("s("),
            $.field(
                $.stry(
                    $.right(
                        $.opt($.str("-")),
                        $.right($.plus($.regex<string>("0-9", [$.ExpRange("0", "9")])), $.eps),
                    ),
                ),
                "index",
                $.right($.str(")"), $.eps),
            ),
        ),
    ),
)
export const StackOp: $.Parser<$ast.StackOp> = $.loc(
    $.field(
        $.pure("StackOp"),
        "$",
        $.field(
            $.lazy(() => StackIndex),
            "first",
            $.field(
                $.lazy(() => StackIndex),
                "second",
                $.field(Identifier, "operation", $.eps),
            ),
        ),
    ),
)
export const StackIndex: $.Parser<$ast.StackIndex> = $.loc(
    $.field(
        $.pure("StackIndex"),
        "$",
        $.right(
            $.str("s"),
            $.field($.stry($.plus($.regex<string>("0-9", [$.ExpRange("0", "9")]))), "index", $.eps),
        ),
    ),
)
export const String: $.Parser<$ast.String> = $.loc(
    $.field(
        $.pure("String"),
        "$",
        $.right(
            $.str('"'),
            $.field(
                $.stry($.star($.regex<'"'>('^"', $.negateExps([$.ExpString('"')])))),
                "content",
                $.right($.str('"'), $.eps),
            ),
        ),
    ),
)
export const keyword = <T>(T: $.Parser<T>): $.Parser<$ast.keyword<T>> =>
    $.lex(
        $.left(
            $.lazy(() => T),
            $.lookNeg(idPart),
        ),
    )
export const reservedWord: $.Parser<$ast.reservedWord> = $.named(
    "reserved word",
    keyword(
        $.alt(
            $.str("PROGRAM"),
            $.alt(
                $.str("END>c"),
                $.alt(
                    $.str("DECLPROC"),
                    $.alt(
                        $.str("DECLMETHOD"),
                        $.alt(
                            $.str("DECLGLOBVAR"),
                            $.alt(
                                $.str("PROC:<{"),
                                $.alt(
                                    $.str("PROCINLINE:<{"),
                                    $.alt(
                                        $.str("PROCREF:<{"),
                                        $.alt(
                                            $.str("METHOD:<{"),
                                            $.alt(
                                                $.str("IF:<{"),
                                                $.alt(
                                                    $.str("ELSE<{"),
                                                    $.alt(
                                                        $.str("IFJMP:<{"),
                                                        $.alt(
                                                            $.str("WHILE:<{"),
                                                            $.alt(
                                                                $.str("DO<{"),
                                                                $.alt(
                                                                    $.str("REPEAT:<{"),
                                                                    $.alt(
                                                                        $.str("UNTIL:<{"),
                                                                        $.alt(
                                                                            $.str("CALLDICT"),
                                                                            $.str("INLINECALLDICT"),
                                                                        ),
                                                                    ),
                                                                ),
                                                            ),
                                                        ),
                                                    ),
                                                ),
                                            ),
                                        ),
                                    ),
                                ),
                            ),
                        ),
                    ),
                ),
            ),
        ),
    ),
)
export const comment: $.Parser<$ast.comment> = $.right(
    $.str("//"),
    $.right(
        $.stry(
            $.star(
                $.regex<"\r" | "\n">(
                    "^\\r\\n",
                    $.negateExps([$.ExpString("\r"), $.ExpString("\n")]),
                ),
            ),
        ),
        $.eps,
    ),
)
export const space: $.Parser<$ast.space> = $.named(
    "space",
    $.alt(
        $.regex<" " | "\t" | "\r" | "\n">(" \\t\\r\\n", [
            $.ExpString(" "),
            $.ExpString("\t"),
            $.ExpString("\r"),
            $.ExpString("\n"),
        ]),
        comment,
    ),
)
