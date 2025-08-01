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
    public readonly position?: PegLocation

    public constructor(message: string, position?: PegLocation) {
        super(message)
        this.name = "ParseError"
        this.position = position
    }
}

const success = (ast: G.$ast.SourceFile): ParseSuccess => ({$: "ParseSuccess", ast})
const failure = (error: ParseError): ParseFailure => ({$: "ParseFailure", error})

export type PegPosition = {
    readonly offset: number
    readonly line: number
    readonly column: number
}

export type PegLocation = {
    readonly source?: string
    readonly start: PegPosition
    readonly end: PegPosition
}

export type PegParseError = {
    readonly message: string
    readonly location: PegLocation
}

export function parse(_filepath: string, code: string): ParseResult {
    try {
        const normalizedCode = code.replaceAll("2DROP", "DROP2").replaceAll("}>CONT", "}> PUSHCONT")
        const ast = $.parse(normalizedCode, {
            startRule: "SourceFile",
        }) as G.$ast.SourceFile
        return success(ast)
    } catch (error) {
        if (error instanceof Error) {
            const pegError = error as unknown as PegParseError
            const message = pegError.message.slice(0, -1) // trim trailing `.`
            return failure(new ParseError(message, pegError.location))
        }
        return failure(new ParseError("Unknown parse error"))
    }
}
