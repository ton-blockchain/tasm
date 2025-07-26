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
