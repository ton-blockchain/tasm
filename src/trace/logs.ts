import type {StackElement} from "../logs"
import {parse} from "../logs"

/**
 * Represents a single TVM Sandbox log entry.
 */
export type LogEntry = {
    readonly hash: string
    readonly offset: number
    readonly stack: readonly StackElement[]
    readonly gas: number
    readonly implicit: boolean
    gasCost: number
}

/**
 * Parses a TVM Sandbox log into a list of transactions, each containing a list of log entries.
 */
export function parseLogs(log: string): LogEntry[][] {
    const vmLines = parse(log)

    const transactions: LogEntry[][] = []
    let entries: LogEntry[] = []

    let currentStack: StackElement[] = []
    let currentGas: number = 1_000_000

    const callStack: string[] = []

    for (const vmLine of vmLines) {
        if (vmLine.$ === "VmStack") {
            currentStack = vmLine.stack
        }

        if (vmLine.$ === "VmLoc") {
            const cellHash = vmLine.hash.toLowerCase()

            if (callStack.length === 0) {
                // first frame
                callStack.push(cellHash)
            } else if (callStack.length > 1 && callStack.at(-2) === cellHash) {
                // return to the previous frame
                callStack.pop()
            } else if (callStack.at(-1) !== cellHash) {
                // new frame
                callStack.push(cellHash)
            }

            entries.push({
                hash: cellHash,
                offset: vmLine.offset,
                stack: currentStack,
                gas: currentGas,
                implicit: false,
                gasCost: 0,
            })
            currentStack = []
        }

        if (vmLine.$ === "VmExecute" && vmLine.instr === "implicit RET") {
            const lastEntry = entries.at(-1)
            if (lastEntry) {
                // Two subsequent RET share the same location, and this is actually wrong,
                // so we manually set the correct hash by callstack
                const actualHash =
                    lastEntry.implicit && callStack.length > 0
                        ? (callStack.at(-1) ?? lastEntry.hash)
                        : lastEntry.hash

                entries.push({
                    ...lastEntry,
                    hash: actualHash,
                    implicit: true,
                    gasCost: 5,
                })
            }
            callStack.pop()
        }

        if (vmLine.$ === "VmGasRemaining") {
            const newGasValue = vmLine.gas
            const diff = currentGas - newGasValue
            const cost = diff < 0 ? 10_000_000 - newGasValue : diff

            const lastEntry = entries.at(-1)
            if (lastEntry) {
                lastEntry.gasCost = cost
            }

            currentGas = newGasValue
        }

        if (vmLine.$ === "VmLimitChanged") {
            currentGas = vmLine.limit // reset gas
        }

        if (vmLine.$ === "VmUnknown" && vmLine.text.includes("console.log")) {
            // new transaction
            currentGas = 1_000_000
            transactions.push([...entries])
            entries = []
        }
    }

    if (entries.length > 0) {
        transactions.push([...entries])
    }

    return transactions
}

export type {StackElement} from "../logs"
