#!/usr/bin/env node

import {cac} from "cac"
import * as fs from "node:fs/promises"
import {Cell} from "@ton/core"
import {decompileCell} from "../runtime"
import {print} from "../text"

interface Options {
    output: string
    format: string
    verbose: boolean
    string?: string
}

async function getBocBuffer(options: Options, file?: string): Promise<Buffer> {
    if (options.string !== undefined) {
        const trimmedContent = options.string.trim()

        if (!trimmedContent) {
            throw new Error("Provided string is empty")
        }

        if (options.format === "hex") {
            return Buffer.from(trimmedContent, "hex")
        }

        if (options.format === "base64") {
            return Buffer.from(trimmedContent, "base64")
        }

        throw new Error(
            `Unsupported format for string input: ${options.format}. Use 'hex' or 'base64'`,
        )
    }

    if (file === undefined) {
        throw new Error("Either file or string input is required")
    }

    if (options.format === "binary") {
        return fs.readFile(file)
    }

    const content = await fs.readFile(file, "utf8")
    const trimmedContent = content.trim()

    if (!trimmedContent) {
        throw new Error("File is empty")
    }

    if (options.format === "hex") {
        return Buffer.from(trimmedContent, "hex")
    }

    if (options.format === "base64") {
        return Buffer.from(trimmedContent, "base64")
    }

    throw new Error(`Unsupported format: ${options.format}`)
}

const cli = cac("tdisasm")

cli.command("[file]", "Disassemble a BOC file or string to TASM")
    .option("-o, --output <file>", "Output file path")
    .option("-f, --format <format>", "Input format (binary|hex|base64)", {default: "binary"})
    .option("-s, --string <data>", "Input data as hex or base64 string instead of file")
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
                    console.log(`Processing string data (${options.format} format)`)
                }
            }

            const bocBuffer = await getBocBuffer(options, file)

            if (options.verbose) {
                console.log(`Parsed BOC buffer of ${bocBuffer.length} bytes`)
            }

            const [rootCell] = Cell.fromBoc(bocBuffer)
            if (!rootCell) {
                throw new Error("No cells found in BOC")
            }

            const instructions = decompileCell(rootCell)

            if (options.verbose) {
                console.log(`Decompiled ${instructions.length} instructions`)
            }

            const assemblyText = print(instructions)

            if (options.output) {
                await fs.writeFile(options.output, assemblyText)
                if (options.verbose) {
                    console.log(`Written to: ${options.output}`)
                }
            } else {
                console.log(assemblyText)
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
