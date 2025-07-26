import type * as $ from "./util"

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
