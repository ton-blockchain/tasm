import type * as $ from "./util"
import type {Slice} from "@ton/core"

export const fPUSHINT = (arg0: bigint, loc?: $.Loc): fPUSHINT => ({
    $: "fPUSHINT",
    arg0,
    loc,
})
export type fPUSHINT = {
    $: "fPUSHINT"
    arg0: bigint
    loc: $.Loc | undefined
}

export const fPUSH = (kind: "stack" | "control", arg0: number, loc?: $.Loc): fPUSH => ({
    $: "fPUSH",
    arg0,
    kind,
    loc,
})
export type fPUSH = {
    $: "fPUSH"
    arg0: number
    kind: "stack" | "control"
    loc: $.Loc | undefined
}

export const fPOP = (kind: "stack" | "control", arg0: number, loc?: $.Loc): fPOP => ({
    $: "fPOP",
    arg0,
    kind,
    loc,
})
export type fPOP = {
    $: "fPOP"
    arg0: number
    kind: "stack" | "control"
    loc: $.Loc | undefined
}

export const fPUSHSLICE = (arg0: Slice, loc?: $.Loc): fPUSHSLICE => ({
    $: "fPUSHSLICE",
    arg0,
    loc,
})
export type fPUSHSLICE = {
    $: "fPUSHSLICE"
    arg0: Slice
    loc: $.Loc | undefined
}

export const fPUSHCONT = (arg0: $.Code, loc?: $.Loc): fPUSHCONT => ({
    $: "fPUSHCONT",
    arg0,
    loc,
})
export type fPUSHCONT = {
    $: "fPUSHCONT"
    arg0: $.Code
    loc: $.Loc | undefined
}

export const fSTSLICECONST = (arg0: Slice, loc?: $.Loc): fSTSLICECONST => ({
    $: "fSTSLICECONST",
    arg0,
    loc,
})
export type fSTSLICECONST = {
    $: "fSTSLICECONST"
    arg0: Slice
    loc: $.Loc | undefined
}

export const fXCHG = (arg0: number, arg1: number, loc?: $.Loc): fXCHG => ({
    $: "fXCHG",
    arg0,
    arg1,
    loc,
})
export type fXCHG = {
    $: "fXCHG"
    arg0: number
    arg1: number
    loc: $.Loc | undefined
}

export const fPUSHINTX = (arg0: bigint, loc?: $.Loc): fPUSHINTX => ({
    $: "fPUSHINTX",
    arg0,
    loc,
})
export type fPUSHINTX = {
    $: "fPUSHINTX"
    arg0: bigint
    loc: $.Loc | undefined
}

export const fPLDUZ = (arg0: number, loc?: $.Loc): fPLDUZ => ({
    $: "fPLDUZ",
    arg0,
    loc,
})
export type fPLDUZ = {
    $: "fPLDUZ"
    arg0: number
    loc: $.Loc | undefined
}

export const fSDBEGINS = (arg0: Slice, loc?: $.Loc): fSDBEGINS => ({
    $: "fSDBEGINS",
    arg0,
    loc,
})
export type fSDBEGINS = {
    $: "fSDBEGINS"
    arg0: Slice
    loc: $.Loc | undefined
}

export const fSDBEGINSQ = (arg0: Slice, loc?: $.Loc): fSDBEGINSQ => ({
    $: "fSDBEGINSQ",
    arg0,
    loc,
})
export type fSDBEGINSQ = {
    $: "fSDBEGINSQ"
    arg0: Slice
    loc: $.Loc | undefined
}

export const fCALLXARGS = (arg0: number, arg1: number, loc?: $.Loc): fCALLXARGS => ({
    $: "fCALLXARGS",
    arg0,
    arg1,
    loc,
})
export type fCALLXARGS = {
    $: "fCALLXARGS"
    arg0: number
    arg1: number
    loc: $.Loc | undefined
}

export const fCALLDICT = (arg0: number, loc?: $.Loc): fCALLDICT => ({
    $: "fCALLDICT",
    arg0,
    loc,
})
export type fCALLDICT = {
    $: "fCALLDICT"
    arg0: number
    loc: $.Loc | undefined
}

export const fJMPDICT = (arg0: number, loc?: $.Loc): fJMPDICT => ({
    $: "fJMPDICT",
    arg0,
    loc,
})
export type fJMPDICT = {
    $: "fJMPDICT"
    arg0: number
    loc: $.Loc | undefined
}

export const fPREPAREDICT = (arg0: number, loc?: $.Loc): fPREPAREDICT => ({
    $: "fPREPAREDICT",
    arg0,
    loc,
})
export type fPREPAREDICT = {
    $: "fPREPAREDICT"
    arg0: number
    loc: $.Loc | undefined
}

export const fTHROW = (arg0: number, loc?: $.Loc): fTHROW => ({
    $: "fTHROW",
    arg0,
    loc,
})
export type fTHROW = {
    $: "fTHROW"
    arg0: number
    loc: $.Loc | undefined
}

export const fTHROWIF = (arg0: number, loc?: $.Loc): fTHROWIF => ({
    $: "fTHROWIF",
    arg0,
    loc,
})
export type fTHROWIF = {
    $: "fTHROWIF"
    arg0: number
    loc: $.Loc | undefined
}

export interface fTHROWIFNOT {
    readonly $: "fTHROWIFNOT"
    readonly arg0: number
    readonly loc?: $.Loc
}

export const fTHROWIFNOT = (arg0: number, loc?: $.Loc): fTHROWIFNOT => ({
    $: "fTHROWIFNOT",
    arg0,
    loc,
})

export interface fIF {
    readonly $: "fIF"
    readonly kind: "IF" | "IFNOT" | "IFJMP" | "IFNOTJMP" | "IFELSE"
    readonly trueBranch: $.Code
    readonly falseBranch?: $.Code // только для IFELSE
    readonly loc?: $.Loc
}

export const fIF = (
    kind: "IF" | "IFNOT" | "IFJMP" | "IFNOTJMP" | "IFELSE",
    trueBranch: $.Code,
    falseBranch?: $.Code,
    loc?: $.Loc,
): fIF => ({
    $: "fIF",
    kind,
    trueBranch,
    falseBranch,
    loc,
})
