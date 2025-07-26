import type * as $ from "./util"
import type * as c from "./fift-instr-constructors"
import {
    CALLDICT,
    CALLDICT_LONG,
    CALLXARGS,
    CALLXARGS_1,
    JMPDICT,
    LSHIFT,
    POP,
    POP_LONG,
    POPCTR,
    PREPAREDICT,
    PUSH,
    PUSH_LONG,
    PUSHCONT,
    PUSHCONT_SHORT,
    PUSHCTR,
    PUSHINT_16,
    PUSHINT_4,
    PUSHINT_8,
    PUSHINT_LONG,
    PUSHNEGPOW2,
    PUSHPOW2,
    PUSHPOW2DEC,
    PUSHREFCONT,
    PUSHREFSLICE,
    PUSHSLICE,
    PUSHSLICE_LONG,
    PUSHSLICE_REFS,
    SDBEGINSX,
    SDBEGINSXQ,
    STSLICECONST,
    STSLICER,
    THROW,
    THROW_SHORT,
    THROWIF,
    THROWIF_SHORT,
    THROWIFNOT,
    THROWIFNOT_SHORT,
    XCHG_0I,
    XCHG_01_LONG,
    XCHG_IJ,
    SDBEGINS,
    SDBEGINSQ,
    EXECUTE,
    JMPX,
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

export const fXCHG: $.Type<c.fXCHG> = {
    load: s => {
        const loaded = instr.load(s)
        if (loaded.$ === "XCHG_0I" || loaded.$ === "XCHG_01_LONG") {
            return {
                $: "fXCHG",
                arg0: 0,
                arg1: loaded.arg0,
                loc: loaded.loc,
            }
        }
        if (loaded.$ === "XCHG_IJ") {
            return {
                $: "fXCHG",
                arg0: loaded.arg0,
                arg1: loaded.arg1,
                loc: loaded.loc,
            }
        }

        throw new Error("unexpected XCHG variant")
    },
    store: (b, val, options) => {
        const i = val.arg0
        const j = val.arg1

        if (i === j) {
            // XCHG with same indices = NOP, just return
            return
        }

        // Ensure i <= j for consistent representation
        const [arg0, arg1] = i <= j ? [i, j] : [j, i]

        if (arg1 === 0) {
            // One of arguments is 0, this shouldn't happen in normalized form
            throw new Error("XCHG with zero argument should use XCHG_0I")
        }

        if (arg0 === 0) {
            // XCHG s0, sj
            if (arg1 < 16) {
                XCHG_0I.store(
                    b,
                    {
                        ...val,
                        arg0: arg1,
                        $: "XCHG_0I",
                    },
                    options,
                )
                return
            } else {
                XCHG_01_LONG.store(
                    b,
                    {
                        ...val,
                        arg0: arg1,
                        $: "XCHG_01_LONG",
                    },
                    options,
                )
                return
            }
        }

        // XCHG si, sj where both i,j > 0
        if (arg0 < 16 && arg1 < 16) {
            XCHG_IJ.store(
                b,
                {
                    ...val,
                    arg0: arg0,
                    arg1: arg1,
                    $: "XCHG_IJ",
                },
                options,
            )
            return
        }

        // For large indices, we need to emit multiple XCHG_01_LONG operations
        // XCHG si, sj = XCHG_01_LONG si, XCHG_01_LONG sj, XCHG_01_LONG si
        XCHG_01_LONG.store(
            b,
            {
                $: "XCHG_01_LONG",
                arg0: arg0,
                loc: val.loc,
            },
            options,
        )
        XCHG_01_LONG.store(
            b,
            {
                $: "XCHG_01_LONG",
                arg0: arg1,
                loc: val.loc,
            },
            options,
        )
        XCHG_01_LONG.store(
            b,
            {
                $: "XCHG_01_LONG",
                arg0: arg0,
                loc: val.loc,
            },
            options,
        )
    },
}

const pow2Decomp = (n: bigint): [bigint, number] => {
    let powers = 0
    let remainder = n
    while (remainder % 2n === 0n && remainder !== 0n) {
        powers++
        remainder = remainder / 2n
    }
    return [remainder, powers]
}

export const fPUSHINTX: $.Type<c.fPUSHINTX> = {
    load: s => {
        // This will load any PUSHINT* variant and convert to fPUSHINTX
        const loaded = instr.load(s)
        if (
            loaded.$ === "PUSHINT_4" ||
            loaded.$ === "PUSHINT_8" ||
            loaded.$ === "PUSHINT_16" ||
            loaded.$ === "PUSHINT_LONG" ||
            loaded.$ === "PUSHPOW2" ||
            loaded.$ === "PUSHNEGPOW2" ||
            loaded.$ === "PUSHPOW2DEC"
        ) {
            return {
                $: "fPUSHINTX",
                arg0: loaded.$ === "PUSHINT_LONG" ? loaded.arg0 : BigInt(loaded.arg0),
                loc: loaded.loc,
            }
        }

        throw new Error("unexpected PUSHINTX variant")
    },
    store: (b, val, options) => {
        const arg = val.arg0

        // Try power of 2 optimizations first
        const [remainder, powers] = pow2Decomp(arg)

        if (remainder === 1n && arg > 0n) {
            // arg = 2^powers
            if (arg === 256n) {
                throw new Error("use PUSHNAN instead of 256 PUSHPOW2")
            }
            PUSHPOW2.store(
                b,
                {
                    ...val,
                    arg0: powers,
                    $: "PUSHPOW2",
                },
                options,
            )
            return
        }

        if (remainder === -1n) {
            // arg = -2^powers
            PUSHNEGPOW2.store(
                b,
                {
                    ...val,
                    arg0: powers,
                    $: "PUSHNEGPOW2",
                },
                options,
            )
            return
        }

        // Try 2^n - 1 optimization
        const plusOne = arg + 1n
        const [remainderPlus, powersPlus] = pow2Decomp(plusOne)
        if (remainderPlus === 1n) {
            PUSHPOW2DEC.store(
                b,
                {
                    ...val,
                    arg0: powersPlus,
                    $: "PUSHPOW2DEC",
                },
                options,
            )
            return
        }

        // Check if it fits in 8 bits (basic PUSHINT logic)
        if (fits(arg, 8)) {
            fPUSHINT.store(
                b,
                {
                    ...val,
                    $: "fPUSHINT",
                },
                options,
            )
            return
        }

        // For large powers, use PUSHINT + LSHIFT
        if (powers >= 20) {
            fPUSHINT.store(
                b,
                {
                    ...val,
                    arg0: remainder,
                    $: "fPUSHINT",
                },
                options,
            )
            LSHIFT.store(
                b,
                {
                    $: "LSHIFT",
                    arg0: powers,
                    loc: val.loc,
                },
                options,
            )
            return
        }

        // Fall back to regular PUSHINT
        fPUSHINT.store(
            b,
            {
                ...val,
                $: "fPUSHINT",
            },
            options,
        )
    },
}

export const fSDBEGINS: $.Type<c.fSDBEGINS> = {
    load: s => {
        const loaded = instr.load(s)
        if (loaded.$ === "SDBEGINSX") {
            // This is a fallback case, we don't have the original slice
            throw new Error("Cannot load SDBEGINSX back to fSDBEGINS")
        }

        throw new Error("unexpected SDBEGINS variant")
    },
    store: (b, val, options) => {
        const arg = val.arg0

        if (arg.remainingRefs > 0) {
            throw new Error("no references allowed in slice")
        }

        const sliceBits = arg.remainingBits
        const opcodeBits = Math.floor((sliceBits + 5) / 8) * 8 + 3 + 21

        if (b.canFit(opcodeBits)) {
            SDBEGINS.store(
                b,
                {
                    ...val,
                    $: "SDBEGINS",
                },
                options,
            )
        } else {
            fPUSHSLICE.store(
                b,
                {
                    ...val,
                    $: "fPUSHSLICE",
                },
                options,
            )
            SDBEGINSX.store(
                b,
                {
                    $: "SDBEGINSX",
                    loc: val.loc,
                },
                options,
            )
        }
    },
}

export const fSDBEGINSQ: $.Type<c.fSDBEGINSQ> = {
    load: s => {
        const loaded = instr.load(s)
        if (loaded.$ === "SDBEGINSXQ") {
            // This is a fallback case, we don't have the original slice
            throw new Error("Cannot load SDBEGINSXQ back to fSDBEGINSQ")
        }

        throw new Error("unexpected SDBEGINSQ variant")
    },
    store: (b, val, options) => {
        const arg = val.arg0

        if (arg.remainingRefs > 0) {
            throw new Error("no references allowed in slice")
        }

        const sliceBits = arg.remainingBits
        const opcodeBits = Math.floor((sliceBits + 5) / 8) * 8 + 3 + 21

        if (b.canFit(opcodeBits)) {
            SDBEGINSQ.store(
                b,
                {
                    ...val,
                    $: "SDBEGINSQ",
                },
                options,
            )
        } else {
            fPUSHSLICE.store(
                b,
                {
                    ...val,
                    $: "fPUSHSLICE",
                },
                options,
            )
            SDBEGINSXQ.store(
                b,
                {
                    $: "SDBEGINSXQ",
                    loc: val.loc,
                },
                options,
            )
        }
    },
}

export const fCALLXARGS: $.Type<c.fCALLXARGS> = {
    load: s => {
        const loaded = instr.load(s)
        if (loaded.$ === "CALLXARGS" || loaded.$ === "CALLXARGS_1") {
            return {
                $: "fCALLXARGS",
                arg0: loaded.arg0,
                arg1: loaded.arg1,
                loc: loaded.loc,
            }
        }

        throw new Error("unexpected CALLXARGS variant")
    },
    store: (b, val, options) => {
        if (val.arg1 === -1) {
            CALLXARGS.store(
                b,
                {
                    ...val,
                    $: "CALLXARGS",
                },
                options,
            )
        } else {
            CALLXARGS_1.store(
                b,
                {
                    ...val,
                    $: "CALLXARGS_1",
                },
                options,
            )
        }
    },
}

export const fCALLDICT: $.Type<c.fCALLDICT> = {
    load: s => {
        const loaded = instr.load(s)
        if (loaded.$ === "CALLDICT" || loaded.$ === "CALLDICT_LONG") {
            return {
                $: "fCALLDICT",
                arg0: loaded.arg0,
                loc: loaded.loc,
            }
        }

        throw new Error("unexpected CALLDICT variant")
    },
    store: (b, val, options) => {
        const arg = val.arg0

        if (arg >= 0 && arg <= 255) {
            CALLDICT.store(
                b,
                {
                    ...val,
                    $: "CALLDICT",
                },
                options,
            )
        } else if (arg >= 0 && arg <= 16383) {
            CALLDICT_LONG.store(
                b,
                {
                    ...val,
                    $: "CALLDICT_LONG",
                },
                options,
            )
        } else {
            fPUSHINT.store(
                b,
                {
                    $: "fPUSHINT",
                    arg0: BigInt(arg),
                    loc: val.loc,
                },
                options,
            )
            PUSHCTR.store(
                b,
                {
                    $: "PUSHCTR",
                    arg0: 3,
                    loc: val.loc,
                },
                options,
            )
            EXECUTE.store(
                b,
                {
                    $: "EXECUTE",
                    loc: val.loc,
                },
                options,
            )
        }
    },
}

export const fJMPDICT: $.Type<c.fJMPDICT> = {
    load: s => {
        const loaded = instr.load(s)
        if (loaded.$ === "JMPDICT") {
            return {
                $: "fJMPDICT",
                arg0: loaded.arg0,
                loc: loaded.loc,
            }
        }

        throw new Error("unexpected JMPDICT variant")
    },
    store: (b, val, options) => {
        const arg = val.arg0

        if (arg >= 0 && arg <= 16383) {
            JMPDICT.store(
                b,
                {
                    ...val,
                    $: "JMPDICT",
                },
                options,
            )
        } else {
            fPUSHINT.store(
                b,
                {
                    $: "fPUSHINT",
                    arg0: BigInt(arg),
                    loc: val.loc,
                },
                options,
            )
            PUSHCTR.store(
                b,
                {
                    $: "PUSHCTR",
                    arg0: 3,
                    loc: val.loc,
                },
                options,
            )
            JMPX.store(
                b,
                {
                    $: "JMPX",
                    loc: val.loc,
                },
                options,
            )
        }
    },
}

export const fPREPAREDICT: $.Type<c.fPREPAREDICT> = {
    load: s => {
        const loaded = instr.load(s)
        if (loaded.$ === "PREPAREDICT") {
            return {
                $: "fPREPAREDICT",
                arg0: loaded.arg0,
                loc: loaded.loc,
            }
        }

        throw new Error("unexpected PREPAREDICT variant")
    },
    store: (b, val, options) => {
        const arg = val.arg0

        if (arg >= 0 && arg <= 16383) {
            PREPAREDICT.store(
                b,
                {
                    ...val,
                    $: "PREPAREDICT",
                },
                options,
            )
        } else {
            fPUSHINT.store(
                b,
                {
                    $: "fPUSHINT",
                    arg0: BigInt(arg),
                    loc: val.loc,
                },
                options,
            )
            PUSHCTR.store(
                b,
                {
                    $: "PUSHCTR",
                    arg0: 3,
                    loc: val.loc,
                },
                options,
            )
        }
    },
}

export const fTHROW: $.Type<c.fTHROW> = {
    load: s => {
        const loaded = instr.load(s)
        if (loaded.$ === "THROW_SHORT" || loaded.$ === "THROW") {
            return {
                $: "fTHROW",
                arg0: loaded.arg0,
                loc: loaded.loc,
            }
        }

        throw new Error("unexpected THROW variant")
    },
    store: (b, val, options) => {
        const arg = val.arg0

        if (arg >= 0 && arg <= 63) {
            THROW_SHORT.store(
                b,
                {
                    ...val,
                    $: "THROW_SHORT",
                },
                options,
            )
        } else if (arg >= 0 && arg <= 2047) {
            THROW.store(
                b,
                {
                    ...val,
                    $: "THROW",
                },
                options,
            )
        } else {
            throw new Error("THROW argument out of range")
        }
    },
}

export const fTHROWIF: $.Type<c.fTHROWIF> = {
    load: s => {
        const loaded = instr.load(s)
        if (loaded.$ === "THROWIF_SHORT" || loaded.$ === "THROWIF") {
            return {
                $: "fTHROWIF",
                arg0: loaded.arg0,
                loc: loaded.loc,
            }
        }

        throw new Error("unexpected THROWIF variant")
    },
    store: (b, val, options) => {
        const arg = val.arg0

        if (arg >= 0 && arg <= 63) {
            THROWIF_SHORT.store(
                b,
                {
                    ...val,
                    $: "THROWIF_SHORT",
                },
                options,
            )
        } else if (arg >= 0 && arg <= 2047) {
            THROWIF.store(
                b,
                {
                    ...val,
                    $: "THROWIF",
                },
                options,
            )
        } else {
            throw new Error("THROWIF argument out of range")
        }
    },
}

export const fTHROWIFNOT: $.Type<c.fTHROWIFNOT> = {
    load: s => {
        const loaded = instr.load(s)
        if (loaded.$ === "THROWIFNOT_SHORT" || loaded.$ === "THROWIFNOT") {
            return {
                $: "fTHROWIFNOT",
                arg0: loaded.arg0,
                loc: loaded.loc,
            }
        }

        throw new Error("unexpected THROWIFNOT variant")
    },
    store: (b, val, options) => {
        const arg = val.arg0

        if (arg >= 0 && arg <= 63) {
            THROWIFNOT_SHORT.store(
                b,
                {
                    ...val,
                    $: "THROWIFNOT_SHORT",
                },
                options,
            )
        } else if (arg >= 0 && arg <= 2047) {
            THROWIFNOT.store(
                b,
                {
                    ...val,
                    $: "THROWIFNOT",
                },
                options,
            )
        } else {
            throw new Error("THROWIFNOT argument out of range")
        }
    },
}
