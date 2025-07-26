import type * as $ from "./util"
import type * as c from "./fift-instr-constructors"
import {PUSHINT_16, PUSHINT_4, PUSHINT_8, PUSHINT_LONG} from "./types"
import {instr} from "./instr"

const fits = (val: bigint, bits: number) =>
    val >= BigInt(-Math.pow(2, bits - 1)) && val <= BigInt(Math.pow(2, bits - 1) - 1)

export const fPUSHINT: $.Type<c.fPUSHINT> = {
    load: s => {
        const loaded = instr.load(s)
        if (loaded.$ === "PUSHINT_4" || loaded.$ === "PUSHINT_8" || loaded.$ === "PUSHINT_16") {
            return {
                $: "fPUSHINT",
                arg0: BigInt(loaded.arg0),
                loc: loaded.loc,
            }
        }
        if (loaded.$ === "PUSHINT_LONG") {
            return {
                $: "fPUSHINT",
                arg0: loaded.arg0,
                loc: loaded.loc,
            }
        }

        throw new Error("unexpected PUSHINT variant")
    },
    store: (b, val) => {
        const arg = val.arg0
        if (arg >= -5 && arg <= 10) {
            PUSHINT_4.store(b, {
                ...val,
                arg0: Number(arg),
                $: "PUSHINT_4",
            })
            return
        }

        if (fits(arg, 8)) {
            PUSHINT_8.store(b, {
                ...val,
                arg0: Number(arg),
                $: "PUSHINT_8",
            })
            return
        }

        if (fits(arg, 16)) {
            PUSHINT_16.store(b, {
                ...val,
                arg0: Number(arg),
                $: "PUSHINT_16",
            })
            return
        }

        PUSHINT_LONG.store(b, {
            ...val,
            $: "PUSHINT_LONG",
        })
    },
}
