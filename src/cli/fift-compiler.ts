#!/usr/bin/env node

import {cac} from "cac"
import * as fs from "node:fs/promises"
import {compile} from "../fift/compile/compile"
import {compileCell} from "../runtime"

interface Options {
    readonly output: string
    readonly format: string
    readonly verbose: boolean
    readonly string?: string
}

async function getContent(
    options: Options,
    file?: string,
): Promise<{content: string; sourceName: string}> {
    if (options.string !== undefined) {
        return {content: options.string, sourceName: "<string>.fif"}
    }

    if (file === undefined) {
        throw new Error("Either file or string input is required")
    }

    const content = await fs.readFile(file, "utf8")
    return {content, sourceName: file}
}

const cli = cac("tfift")

cli.command("[file]", "Compile a Fift assembly file or string to BOC")
    .option("-o, --output <file>", "Output file path")
    .option("-f, --format <format>", "Output format (binary|hex|base64)", {default: "binary"})
    .option("-s, --string <data>", "Input Fift assembly code as a string instead of file")
    .option("--verbose", "Verbose output")
    .action(async (file: string, options: Options) => {
        if (!file && options.string === undefined) {
            console.error("Error: Either input file or string data is required")
            process.exit(1)
        }

        try {
            if (options.verbose) {
                if (options.string === undefined) {
                    console.log(`Reading file: ${file}`)
                } else {
                    console.log("Reading from string data")
                }
            }

            const {content, sourceName} = await getContent(options, file)
            const instructions = compile(sourceName, content)

            const cell = compileCell(instructions)
            const boc = cell.toBoc()

            if (options.output) {
                switch (options.format) {
                    case "binary":
                        await fs.writeFile(options.output, boc)
                        break
                    case "base64":
                        await fs.writeFile(options.output, boc.toString("base64"))
                        break
                    default:
                        await fs.writeFile(options.output, boc.toString("hex"))
                        break
                }
                if (options.verbose) {
                    console.log(`Written to: ${options.output}`)
                }
            } else {
                switch (options.format) {
                    case "binary":
                        process.stdout.write(boc)
                        break
                    case "base64":
                        console.log(boc.toString("base64"))
                        break
                    default:
                        console.log(boc.toString("hex"))
                        break
                }
            }
        } catch (error: unknown) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            console.error(`Error: ${error instanceof Error ? error.message : error}`)
            process.exit(1)
        }
    })

cli.help()
cli.version("0.0.1")

cli.parse()
