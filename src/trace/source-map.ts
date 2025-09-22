enum FunctionInlineMode {
    NotCalculated = 0,
    InlineViaFif = 1,
    InlineRef = 2,
    InlineInPlace = 3,
    NoInline = 4,
}

export type SourceMapEntry = {
    readonly idx: number
    readonly is_entry: boolean

    readonly descr?: string
    readonly opcode?: string
    readonly line_str?: string
    readonly line_off?: string

    readonly ast_kind: string
    readonly file: string
    readonly line: number
    readonly line_offset: number
    readonly pos: number
    readonly length: number
    readonly vars: readonly SourceMapVariable[]

    readonly func: string
    readonly inlined_to_func?: string
    readonly func_inline_mode: FunctionInlineMode
    readonly before_inlined_function_call: boolean
    readonly after_inlined_function_call: boolean
}

export type SourceMapVariable = {
    readonly name: string
    readonly type: string
    readonly possible_qualifier_types: readonly string[]
    readonly value?: string
}

export type SourceMapGlobalVariable = {
    readonly name: string
    readonly type: string
}

export type SourceMapFile = {
    readonly path: string
    readonly is_stdlib: boolean
    readonly content: string
}

export type SourceMap = {
    readonly version: string
    readonly debugCode64?: string
    readonly files: readonly SourceMapFile[]
    readonly globals: readonly SourceMapGlobalVariable[]
    readonly locations: readonly SourceMapEntry[]
}

export const loadSourceMap = (content: string): SourceMap => {
    return JSON.parse(content) as SourceMap
}
