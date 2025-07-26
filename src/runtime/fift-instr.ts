import type * as $ from "./util"
import type * as c from "./fift-instr-constructors"
import {
    POP,
    POP_LONG,
    POPCTR,
    PUSH,
    PUSH_LONG,
    PUSHCONT,
    PUSHCONT_SHORT,
    PUSHCTR,
    PUSHINT_16,
    PUSHINT_4,
    PUSHINT_8,
    PUSHINT_LONG,
    PUSHREFCONT,
    PUSHREFSLICE,
    PUSHSLICE,
    PUSHSLICE_LONG,
    PUSHSLICE_REFS,
    STSLICECONST,
    STSLICER,
} from "./types"
import {instr} from "./instr"
import {codeSlice, rawCode, uint} from "./util"
import {CodeBuilder} from "./builder"

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
    store: (b, val, options) => {
        const arg = val.arg0
        if (arg >= -5 && arg <= 10) {
            PUSHINT_4.store(
                b,
                {
                    ...val,
                    arg0: Number(arg),
                    $: "PUSHINT_4",
                },
                options,
            )
            return
        }

        if (fits(arg, 8)) {
            PUSHINT_8.store(
                b,
                {
                    ...val,
                    arg0: Number(arg),
                    $: "PUSHINT_8",
                },
                options,
            )
            return
        }

        if (fits(arg, 16)) {
            PUSHINT_16.store(
                b,
                {
                    ...val,
                    arg0: Number(arg),
                    $: "PUSHINT_16",
                },
                options,
            )
            return
        }

        PUSHINT_LONG.store(
            b,
            {
                ...val,
                $: "PUSHINT_LONG",
            },
            options,
        )
    },
}

export const fPUSH: $.Type<c.fPUSH> = {
    load: s => {
        const loaded = instr.load(s)
        if (loaded.$ === "PUSH" || loaded.$ === "PUSH_LONG") {
            return {
                $: "fPUSH",
                arg0: loaded.arg0,
                kind: "stack",
                loc: loaded.loc,
            }
        }
        if (loaded.$ === "PUSHCTR") {
            return {
                $: "fPUSH",
                arg0: loaded.arg0,
                kind: "control",
                loc: loaded.loc,
            }
        }

        throw new Error("unexpected PUSH variant")
    },
    store: (b, val, options) => {
        const arg = val.arg0

        if (val.kind === "control") {
            PUSHCTR.store(
                b,
                {
                    ...val,
                    arg0: arg,
                    $: "PUSHCTR",
                },
                options,
            )
            return
        }

        if (arg < 16) {
            PUSH.store(
                b,
                {
                    ...val,
                    arg0: arg,
                    $: "PUSH",
                },
                options,
            )
            return
        }

        PUSH_LONG.store(
            b,
            {
                ...val,
                arg0: arg,
                $: "PUSH_LONG",
            },
            options,
        )
    },
}

export const fPOP: $.Type<c.fPOP> = {
    load: s => {
        const loaded = instr.load(s)
        if (loaded.$ === "POP" || loaded.$ === "POP_LONG") {
            return {
                $: "fPOP",
                arg0: loaded.arg0,
                kind: "stack",
                loc: loaded.loc,
            }
        }
        if (loaded.$ === "POPCTR") {
            return {
                $: "fPOP",
                arg0: loaded.arg0,
                kind: "control",
                loc: loaded.loc,
            }
        }

        throw new Error("unexpected POP variant")
    },
    store: (b, val, options) => {
        const arg = val.arg0

        if (val.kind === "control") {
            POPCTR.store(
                b,
                {
                    ...val,
                    arg0: arg,
                    $: "POPCTR",
                },
                options,
            )
            return
        }

        if (arg < 16) {
            POP.store(
                b,
                {
                    ...val,
                    arg0: arg,
                    $: "POP",
                },
                options,
            )
            return
        }

        POP_LONG.store(
            b,
            {
                ...val,
                arg0: arg,
                $: "POP_LONG",
            },
            options,
        )
    },
}

export const fPUSHSLICE: $.Type<c.fPUSHSLICE> = {
    load: s => {
        const loaded = instr.load(s)
        if (
            loaded.$ === "PUSHSLICE" ||
            loaded.$ === "PUSHSLICE_REFS" ||
            loaded.$ === "PUSHSLICE_LONG"
        ) {
            return {
                $: "fPUSHSLICE",
                arg0: loaded.arg0,
                loc: loaded.loc,
            }
        }

        throw new Error("unexpected PUSHSLICE variant")
    },
    store: (b, val, options) => {
        const arg = val.arg0

        if (!b.canFit(val.arg0.remainingBits + 26)) {
            // cannot place slice and instruction inline
            PUSHREFSLICE.store(
                b,
                {
                    ...val,
                    arg0: rawCode(arg),
                    $: "PUSHREFSLICE",
                },
                options,
            )
            return
        }

        if (arg.remainingRefs === 0 && arg.remainingBits <= 123) {
            PUSHSLICE.store(
                b,
                {
                    ...val,
                    arg0: arg,
                    $: "PUSHSLICE",
                },
                options,
            )
            return
        }

        if (arg.remainingRefs > 0 && arg.remainingRefs < 3 && arg.remainingBits <= 248) {
            PUSHSLICE_REFS.store(
                b,
                {
                    ...val,
                    arg0: arg,
                    $: "PUSHSLICE_REFS",
                },
                options,
            )
            return
        }

        PUSHSLICE_LONG.store(
            b,
            {
                ...val,
                arg0: arg,
                $: "PUSHSLICE_LONG",
            },
            options,
        )
    },
}

export const fPUSHCONT: $.Type<c.fPUSHCONT> = {
    load: s => {
        const loaded = instr.load(s)
        if (
            loaded.$ === "PUSHCONT" ||
            loaded.$ === "PUSHCONT_SHORT" ||
            loaded.$ === "PUSHREFCONT"
        ) {
            return {
                $: "fPUSHCONT",
                arg0: loaded.arg0,
                loc: loaded.loc,
            }
        }

        throw new Error("unexpected PUSHCONT variant")
    },
    store: (b, val, options) => {
        const arg = val.arg0

        const b2 = new CodeBuilder()
        codeSlice(uint(2), uint(7)).store(b2, arg, options)
        const codeAsSlice = b2.asSlice()

        if (!b.canFit(codeAsSlice.remainingBits)) {
            PUSHREFCONT.store(
                b,
                {
                    ...val,
                    arg0: arg,
                    $: "PUSHREFCONT",
                },
                options,
            )
            return
        }

        if (codeAsSlice.remainingRefs === 0 && codeAsSlice.remainingBits <= 120) {
            PUSHCONT_SHORT.store(
                b,
                {
                    ...val,
                    arg0: arg,
                    $: "PUSHCONT_SHORT",
                },
                options,
            )
            return
        }

        PUSHCONT.store(
            b,
            {
                ...val,
                arg0: arg,
                $: "PUSHCONT",
            },
            options,
        )
    },
}

export const fSTSLICECONST: $.Type<c.fSTSLICECONST> = {
    load: s => {
        const loaded = instr.load(s)
        if (loaded.$ === "STSLICECONST") {
            return {
                $: "fSTSLICECONST",
                arg0: loaded.arg0,
                loc: loaded.loc,
            }
        }

        throw new Error("unexpected STSLICECONST variant")
    },
    store: (b, val, options) => {
        const arg = val.arg0

        if (!b.canFit(arg.remainingBits + 22)) {
            // cannot place slice and instruction inline
            fPUSHSLICE.store(
                b,
                {
                    ...val,
                    $: "fPUSHSLICE",
                },
                options,
            )
            STSLICER.store(
                b,
                {
                    $: "STSLICER",
                    loc: val.loc,
                },
                options,
            )
            return
        }

        if (arg.remainingBits <= 57 && arg.remainingRefs <= 3) {
            STSLICECONST.store(
                b,
                {
                    ...val,
                    $: "STSLICECONST",
                },
                options,
            )
            return
        }

        fPUSHSLICE.store(
            b,
            {
                ...val,
                $: "fPUSHSLICE",
            },
            options,
        )
        STSLICER.store(
            b,
            {
                $: "STSLICER",
                loc: val.loc,
            },
            options,
        )
    },
}
