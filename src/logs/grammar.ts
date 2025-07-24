/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @typescript-eslint/no-duplicate-type-constituents */
/* eslint-disable @typescript-eslint/no-unused-vars */
export namespace $ast {
    export type VmLoc = {
        readonly $: "VmLoc"
        readonly hash: hex
        readonly offset: $number
    }
    export type VmStack = {
        readonly $: "VmStack"
        readonly stack: string
    }
    export type VmExecute = {
        readonly $: "VmExecute"
        readonly instr: string
    }
    export type VmLimitChanged = {
        readonly $: "VmLimitChanged"
        readonly limit: $number
    }
    export type VmGasRemaining = {
        readonly $: "VmGasRemaining"
        readonly gas: $number
    }
    export type VmException = {
        readonly $: "VmException"
        readonly errno: $number
        readonly message: string
    }
    export type VmExceptionHandler = {
        readonly $: "VmExceptionHandler"
        readonly errno: $number
    }
    export type VmFinalC5 = {
        readonly $: "VmFinalC5"
        readonly value: Cell
    }
    export type VmUnknown = {
        readonly $: "VmUnknown"
        readonly text: string
    }
    export type vmLine =
        | VmLoc
        | VmStack
        | VmExecute
        | VmLimitChanged
        | VmGasRemaining
        | VmException
        | VmExceptionHandler
        | VmFinalC5
        | VmUnknown
    export type VmParsedStack = {
        readonly $: "VmParsedStack"
        readonly values: readonly VmStackValue[]
    }
    export type VmStackValue = {
        readonly $: "VmStackValue"
        readonly value:
            | Null
            | NaN
            | Integer
            | Tuple
            | TupleParen
            | Cell
            | Continuation
            | Builder
            | CellSlice
            | Unknown
    }
    export type Null = {
        readonly $: "Null"
    }
    export type NaN = {
        readonly $: "NaN"
    }
    export type Integer = {
        readonly $: "Integer"
        readonly value: $number
    }
    export type Tuple = {
        readonly $: "Tuple"
        readonly elements: readonly VmStackValue[]
    }
    export type TupleParen = {
        readonly $: "TupleParen"
        readonly elements: readonly VmStackValue[]
    }
    export type Cell = {
        readonly $: "Cell"
        readonly value: hex
    }
    export type Continuation = {
        readonly $: "Continuation"
        readonly value: string
    }
    export type Builder = {
        readonly $: "Builder"
        readonly value: hex
    }
    export type Unknown = {
        readonly $: "Unknown"
    }
    export type CellSlice = {
        readonly $: "CellSlice"
        readonly body: CellSliceBody | CellSliceShortBody
    }
    export type CellSliceBody = {
        readonly $: "CellSliceBody"
        readonly value: hex
        readonly bits: CellSliceBits
        readonly refs: CellSliceRefs
    }
    export type CellSliceBits = {
        readonly $: "CellSliceBits"
        readonly start: $number
        readonly end: $number
    }
    export type CellSliceRefs = {
        readonly $: "CellSliceRefs"
        readonly start: $number
        readonly end: $number
    }
    export type CellSliceShortBody = {
        readonly $: "CellSliceShortBody"
        readonly value: hex
    }
    export type $number = {
        readonly op: "-" | undefined
        readonly value: string
    }
    export type hex = string
}
