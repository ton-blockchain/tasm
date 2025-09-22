enum FunctionInlineMode {
    NotCalculated = 0,
    InlineViaFif = 1,
    InlineRef = 2,
    InlineInPlace = 3,
    NoInline = 4,
}

export type SourceMapLocation = {
    readonly file: string
    readonly line: number
    readonly col: number
    readonly line_offset: number
    readonly length: number
}

export type SourceMapEntryContext = {
    readonly descr?: string
    readonly is_entry?: boolean
    readonly ast_kind: string
    readonly func_name: string
    readonly inlined_to_func?: string
    readonly func_inline_mode: FunctionInlineMode
    readonly before_inlined_function_call?: boolean
    readonly after_inlined_function_call?: boolean
}

export type SourceMapDebugInfo = {
    readonly opcode?: string
    readonly line_str?: string
    readonly line_off?: string
}

export type SourceMapEntry = {
    readonly idx: number
    readonly loc: SourceMapLocation
    readonly vars: readonly SourceMapVariable[]
    readonly context: SourceMapEntryContext
    readonly debug?: SourceMapDebugInfo
}

export type SourceMapVariable = {
    readonly name: string
    readonly type: string
    readonly constant_value?: string
    readonly possible_qualifier_types: readonly string[]
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
    readonly files: readonly SourceMapFile[]
    readonly globals: readonly SourceMapGlobalVariable[]
    readonly locations: readonly SourceMapEntry[]
}

export const loadSourceMap = (content: string): SourceMap => {
    return JSON.parse(content) as SourceMap
}
