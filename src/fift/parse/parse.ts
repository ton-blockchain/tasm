import type * as G from "./grammar"
import * as $ from "./grammar.gen.pegjs"

export type ParseResult = ParseSuccess | ParseFailure

export type ParseSuccess = {
    readonly $: "ParseSuccess"
    readonly ast: G.$ast.SourceFile
}

export type ParseFailure = {
    readonly $: "ParseFailure"
    readonly error: ParseError
}

export class ParseError extends Error {
    public readonly position?: number

    public constructor(message: string, position?: number) {
        super(message)
        this.name = "ParseError"
        this.position = position
    }
}

const success = (ast: G.$ast.SourceFile): ParseSuccess => ({$: "ParseSuccess", ast})
const failure = (error: ParseError): ParseFailure => ({$: "ParseFailure", error})

export function parse(_filepath: string, code: string): ParseResult {
    try {
        const ast = $.parse(code, {startRule: "SourceFile"}) as G.$ast.SourceFile
        return success(ast)
    } catch (error) {
        if (error instanceof Error) {
            const pegError = error as $.SyntaxError
            return failure(new ParseError(pegError.message))
        }
        return failure(new ParseError("Unknown parse error"))
    }
}
