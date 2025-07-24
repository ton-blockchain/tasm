import * as $ from "@tonstudio/parser-runtime"
import * as G from "./grammar"

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

export function parse(filepath: string, code: string): ParseResult {
    const res = $.parse({
        grammar: G.SourceFile,
        space: G.space,
        text: code,
    })

    if (res.$ !== "success") {
        const {expected, position} = res.error
        return failure(
            new ParseError(
                `Expected ${getExpectedText(expected)} at position ${position}`,
                position,
            ),
        )
    }

    return success(res.value)
}

const getExpectedText = (expected: ReadonlySet<string>) => {
    const result: string[] = []
    const failures = [...expected].sort()
    for (const [idx, failure] of failures.entries()) {
        if (idx > 0) {
            if (idx === failures.length - 1) {
                result.push(failures.length > 2 ? ", or " : " or ")
            } else {
                result.push(", ")
            }
        }
        result.push(failure)
    }
    return result.join("")
}
