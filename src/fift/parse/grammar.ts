/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @typescript-eslint/no-duplicate-type-constituents */
/* eslint-disable @typescript-eslint/no-unused-vars */
export namespace $ast {
    export type SourceFile = {
        readonly $: "SourceFile"
        readonly include: IncludeDirective | undefined
        readonly program: Program
    }

    export type IncludeDirective = {
        readonly $: "IncludeDirective"
        readonly path: string
    }

    export type Program = {
        readonly $: "Program"
        readonly declarations: readonly Declaration[]
        readonly definitions: readonly Definition[]
    }

    export type Declaration = {
        readonly $: "Declaration"
        readonly decl: ProcDeclaration | MethodDeclaration | GlobalVar
    }

    export type ProcDeclaration = {
        readonly $: "ProcDeclaration"
        readonly name: Identifier
    }

    export type MethodDeclaration = {
        readonly $: "MethodDeclaration"
        readonly method_id: Integer
        readonly name: Identifier
    }

    export type GlobalVar = {
        readonly $: "GlobalVar"
        readonly name: Identifier
    }

    export type Definition = {
        readonly $: "Definition"
        readonly def: ProcDefinition | ProcInlineDefinition | ProcRefDefinition | MethodDefinition
    }

    export type ProcDefinition = {
        readonly $: "ProcDefinition"
        readonly name: Identifier
        readonly instructions: readonly Instruction[]
    }

    export type ProcInlineDefinition = {
        readonly $: "ProcInlineDefinition"
        readonly name: Identifier
        readonly instructions: readonly Instruction[]
    }

    export type ProcRefDefinition = {
        readonly $: "ProcRefDefinition"
        readonly name: Identifier
        readonly instructions: readonly Instruction[]
    }

    export type MethodDefinition = {
        readonly $: "MethodDefinition"
        readonly name: Identifier
        readonly instructions: readonly Instruction[]
    }

    export type Instruction = {
        readonly $: "Instruction"
        readonly instr:
            | IfStatement
            | IfjmpStatement
            | WhileStatement
            | RepeatStatement
            | UntilStatement
            | AsmExpression
    }

    export type AsmExpression = {
        readonly $: "AsmExpression"
        readonly arguments: AsmArgumentList | undefined
        readonly name: TvmInstruction
    }

    export type AsmArgumentList = {
        readonly $: "AsmArgumentList"
        readonly primitives: readonly AsmPrimitive[]
    }

    export type AsmPrimitive = {
        readonly $: "AsmPrimitive"
        readonly prim:
            | InstructionBlock
            | String
            | HexBitString
            | BinBitString
            | BocHex
            | StackRegister
            | ControlRegister
            | Integer
            | ArgIdentifier
            | FiftAddressNone
    }

    export type IfStatement = {
        readonly $: "IfStatement"
        readonly kind: "IF:<{" | "IFNOT:<{"
        readonly instructions: readonly Instruction[]
        readonly else_block:
            | {
                  readonly instructions: readonly Instruction[]
              }
            | undefined
    }

    export type IfjmpStatement = {
        readonly $: "IfjmpStatement"
        readonly kind: "IFJMP:<{" | "IFNOTJMP:<{"
        readonly instructions: readonly Instruction[]
    }

    export type WhileStatement = {
        readonly $: "WhileStatement"
        readonly condition: readonly Instruction[]
        readonly body: readonly Instruction[]
    }

    export type RepeatStatement = {
        readonly $: "RepeatStatement"
        readonly instructions: readonly Instruction[]
    }

    export type UntilStatement = {
        readonly $: "UntilStatement"
        readonly instructions: readonly Instruction[]
    }

    export type InstructionBlock = {
        readonly $: "InstructionBlock"
        readonly instructions: readonly Instruction[]
    }

    export type HexBitString = {
        readonly $: "HexBitString"
        readonly content: string
    }

    export type BinBitString = {
        readonly $: "BinBitString"
        readonly content: string
    }

    export type FiftAddressNone = {
        readonly $: "FiftAddressNone"
    }

    export type BocHex = {
        readonly $: "BocHex"
        readonly content: string
    }

    export type Identifier = {
        readonly $: "Identifier"
        readonly name: string
    }

    export type ArgIdentifier = {
        readonly $: "ArgIdentifier"
        readonly name: string
    }

    export type TvmInstruction = {
        readonly $: "TvmInstruction"
        readonly value: string
    }

    export type Integer = {
        readonly $: "Integer"
        readonly value: string
    }

    export type StackRegister = {
        readonly $: "StackRegister"
        readonly value: string
    }

    export type ControlRegister = {
        readonly $: "ControlRegister"
        readonly value: string
    }

    export type String = {
        readonly $: "String"
        readonly content: string
    }
}
