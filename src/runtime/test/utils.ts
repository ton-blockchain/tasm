export function normalizeIndentation(input: string): string {
    const lines = input.split("\n")
    if (lines.length <= 1) return input

    const indents = lines
        .slice(1, -1)
        .filter(line => line.trim().length > 0)
        .map(line => /^\s*/.exec(line)?.[0]?.length ?? 0)
    const minIndent = Math.min(...indents)

    if (minIndent === 0) {
        return input
    }

    return lines
        .flatMap((line, index) => {
            if (index === 0 && line.trim().length === 0) return []
            if (index === 0) return line
            if (minIndent > line.length) {
                return [line.trimStart()]
            }
            return [line.slice(minIndent)]
        })
        .join("\n")
}
