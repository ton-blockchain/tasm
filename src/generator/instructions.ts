export type arg =
    | uint
    | int
    | refs
    | delta
    | stack
    | control
    | plduzArg
    | tinyInt
    | largeInt
    | runvmArg
    | hash
    | minusOne
    | s1
    | setcpArg
    | slice
    | codeSlice
    | refCodeSlice
    | inlineCodeSlice
    | exoticCell
    | debugstr

export type range = {min: bigint, max: bigint}
export const range = (min: bigint, max: bigint) => ({min, max})

export type uint = {$: "uint", len: number, range: range}
export const uint = (len: number, range: range): uint => ({$: "uint", len, range})

export type int = {$: "int", len: number, range: range}
export const int = (len: number, range: range): int => ({$: "int", len, range})

export type refs = {$: "refs", count: number}
export const refs = (count: number): refs => ({$: "refs", count})

export type delta = {$: "delta", delta: number, arg: arg}
export const delta = (delta: number, arg: arg): delta => ({$: "delta", delta, arg})

export type stack = {$: "stack", len: number, range: range}
export const stack = (len: number): stack => ({$: "stack", len, range: range(0n, BigInt(Math.pow(2, len) - 1))})
export const stack2 = (len: number, start: bigint): stack => ({
    $: "stack",
    len,
    range: range(start, BigInt(Math.pow(2, len) - 1)),
})

export type control = {$: "control", range: range}
export const control: control = {$: "control", range: range(0n, 15n)}

// special case: plduz
export type plduzArg = {$: "plduzArg", range: range}
export const plduzArg: plduzArg = {$: "plduzArg", range: range(0n, 7n)}

// special case: [-5, 10]
export type tinyInt = {$: "tinyInt", range: range}
export const tinyInt: tinyInt = {$: "tinyInt", range: range(-5n, 10n)}

export type largeInt = {$: "largeInt", range: range}
const largeIntRange = range(-(2n ** 267n), 2n ** 267n - 1n)
export const largeInt: largeInt = {$: "largeInt", range: largeIntRange}

// special case: XCHG s1 $
export type s1 = {$: "s1"}
export const s1: s1 = {$: "s1"}

// special case: CALLXARGS $ -1
export type minusOne = {$: "minusOne"}
export const minusOne: minusOne = {$: "minusOne"}

export type runvmArg = {$: "runvmArg"}
export const runvmArg: runvmArg = {$: "runvmArg"}

export type hash = {$: "hash"}
export const hash: hash = {$: "hash"}

// special case: [-15, 239]
export type setcpArg = {$: "setcpArg", range: range}
export const setcpArg: setcpArg = {$: "setcpArg", range: range(-15n, 239n)}

export type args = simpleArgs | xchgArgs | dictpush

export type simpleArgs = {$: "simpleArgs", children: arg[]}
export const seq = (...args: arg[]): simpleArgs => ({$: "simpleArgs", children: args})

export type xchgArgs = {$: "xchgArgs", range: range}
export const xchgArgs: xchgArgs = {$: "xchgArgs", range: range(1n, 16n)}

export type codeSlice = {$: "codeSlice", refs: arg, bits: arg}
export const codeSlice = (refs: arg, bits: arg): codeSlice => ({$: "codeSlice", refs, bits})

export type inlineCodeSlice = {$: "inlineCodeSlice", bits: arg}
export const inlineCodeSlice = (bits: arg): inlineCodeSlice => ({$: "inlineCodeSlice", bits})

export type refCodeSlice = {$: "refCodeSlice"}
export const refCodeSlice: refCodeSlice = {$: "refCodeSlice"}

export type slice = {$: "slice", refs: arg, bits: arg, pad: number}
export const slice = (refs: arg, bits: arg, pad: number): slice => ({$: "slice", refs, bits, pad})

export type exoticCell = {$: "exoticCell"}
export const exoticCell: exoticCell = {$: "exoticCell"}

export type dictpush = {$: "dictpush"}
export const dictpush: dictpush = {$: "dictpush"}

export type debugstr = {$: "debugstr"}
export const debugstr: debugstr = {$: "debugstr"}

/// section: effects
export type Effect = CellLoad | CellCreate | CanThrow | AlwaysThrow | Tuple | ImplicitJumpRef

export type CellLoad = {$: "CellLoad", costs: [100, 25]}
export const CellLoad = (): CellLoad => ({$: "CellLoad", costs: [100, 25] as const})

export type CellCreate = {$: "CellCreate", costs: [500]}
export const CellCreate = (): CellCreate => ({$: "CellCreate", costs: [500] as const})

export type CanThrow = {$: "CanThrow", costs: [0, 50]}
export const CanThrow = (): CanThrow => ({$: "CanThrow", costs: [0, 50] as const})

export type AlwaysThrow = {$: "AlwaysThrow", costs: [50]}
export const AlwaysThrow = (): AlwaysThrow => ({$: "AlwaysThrow", costs: [50] as const})

export type Tuple = {$: "Tuple", costs: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]}
export const Tuple = (): Tuple => ({$: "Tuple", costs: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] as const})

export type ImplicitJumpRef = {$: "ImplicitJumpRef", costs: [0, 10]}
export const ImplicitJumpRef = (): ImplicitJumpRef => ({$: "ImplicitJumpRef", costs: [0, 10] as const})
/// end section

export type Opcode = {
    readonly min: number;
    readonly max: number;
    readonly checkLen: number;
    readonly skipLen: number;
    readonly exec: string;
    readonly cat: string;
    readonly version: undefined | number;
    readonly args: args;
    readonly kind: "dummy" | "simple" | "fixed" | "fixed-range" | "ext" | "ext-range"
    readonly prefix: number,
    readonly effects?: readonly Effect[],
}

const cat = (cat: string, o: Opcode): Opcode => {
    return {...o, cat}
}

const effects = (o: Opcode, ...effects: readonly Effect[]): Opcode => {
    return {...o, effects: effects}
}

const version = (version: number, o: Opcode): Opcode => {
    return {...o, version}
}

export const MAX_OPCODE_BITS = 24

const mksimple = (
    opcode: number,
    pfxLen: number,
    exec: string,
): Opcode => {
    return {
        min: opcode << (MAX_OPCODE_BITS - pfxLen),
        max: (opcode + 1) << (MAX_OPCODE_BITS - pfxLen),
        checkLen: pfxLen,
        skipLen: pfxLen,
        args: seq(),
        exec,
        cat: "",
        version: undefined,
        kind: "simple",
        prefix: opcode,
    }
}

const mkfixedn = (
    opcode: number,
    pfxLen: number,
    argLen: number,
    args: args,
    exec: string,
): Opcode => {
    return {
        min: opcode << (MAX_OPCODE_BITS - pfxLen),
        max: (opcode + 1) << (MAX_OPCODE_BITS - pfxLen),
        checkLen: pfxLen,
        skipLen: pfxLen + argLen,
        args,
        exec,
        cat: "",
        version: undefined,
        kind: "fixed",
        prefix: opcode,
    }
}

const mkfixedpseudo = (
    opcode: number,
    args: args,
): Opcode => {
    return {
        min: 0,
        max: 0,
        checkLen: 0,
        skipLen: 0,
        args,
        exec: "",
        cat: "",
        version: undefined,
        kind: "fixed",
        prefix: opcode,
    }
}

const mkfixedrangen = (
    opcode_min: number,
    opcode_max: number,
    totLen: number,
    argLen: number,
    args: args,
    exec: string,
): Opcode => {
    return {
        min: opcode_min << (MAX_OPCODE_BITS - totLen),
        max: opcode_max << (MAX_OPCODE_BITS - totLen),
        checkLen: totLen - argLen,
        skipLen: totLen,
        args,
        exec,
        cat: "",
        version: undefined,
        kind: "fixed-range",
        prefix: opcode_min,
    }
}

const mkext = (
    opcode: number,
    pfxLen: number,
    argLen: number,
    args: args,
    exec: string,
): Opcode => {
    return {
        min: opcode << (MAX_OPCODE_BITS - pfxLen),
        max: (opcode + 1) << (MAX_OPCODE_BITS - pfxLen),
        checkLen: pfxLen,
        skipLen: pfxLen + argLen,
        args,
        exec,
        cat: "",
        version: undefined,
        kind: "ext",
        prefix: opcode,
    }
}

const mkextrange = (
    opcode_min: number,
    opcode_max: number,
    totLen: number,
    argLen: number,
    args: args,
    exec: string,
): Opcode => {
    return {
        min: opcode_min << (MAX_OPCODE_BITS - totLen),
        max: opcode_max << (MAX_OPCODE_BITS - totLen),
        checkLen: totLen - argLen,
        skipLen: totLen,
        args,
        exec,
        cat: "",
        version: undefined,
        kind: "ext-range",
        prefix: opcode_min,
    }
}

const int8range = range(-128n, 127n)
const int16range = range(BigInt(-Math.pow(2, 15)), BigInt(Math.pow(2, 15) - 1))

const uint8range = range(0n, 255n)
const uint4range = range(0n, 15n)
const uint2range = range(0n, BigInt(Math.pow(2, 2) - 1))
const uint3range = range(0n, BigInt(Math.pow(2, 3) - 1))
const uint5range = range(0n, BigInt(Math.pow(2, 5) - 1))
const uint6range = range(0n, BigInt(Math.pow(2, 6) - 1))
const uint7range = range(0n, BigInt(Math.pow(2, 7) - 1))
const uint11range = range(0n, BigInt(Math.pow(2, 11) - 1))
const uint14range = range(0n, BigInt(Math.pow(2, 14) - 1))

const int8 = int(8, int8range)
const int16 = int(16, int16range)

const uint2 = uint(2, uint2range)
const uint3 = uint(3, uint3range)
const uint4 = uint(4, uint4range)
const uint5 = uint(5, uint5range)
const uint6 = uint(6, uint6range)
const uint7 = uint(7, uint7range)
const uint8 = uint(8, uint8range)
const uint11 = uint(11, uint11range)
const uint14 = uint(14, uint14range)

export const instructions: Record<string, Opcode> = {
    PUSHNAN: cat("int_const", mksimple(0x83ff, 16, `exec_push_nan`)),
    ADD: cat("add_mul", mksimple(0xa0, 8, `(_1) => exec_add(_1, false)`)),
    SUB: cat("add_mul", mksimple(0xa1, 8, `(_1) => exec_sub(_1, false)`)),
    SUBR: cat("add_mul", mksimple(0xa2, 8, `(_1) => exec_subr(_1, false)`)),
    NEGATE: cat("add_mul", mksimple(0xa3, 8, `(_1) => exec_negate(_1, false)`)),
    INC: cat("add_mul", mksimple(0xa4, 8, `(_1) => exec_inc(_1, false)`)),
    DEC: cat("add_mul", mksimple(0xa5, 8, `(_1) => exec_dec(_1, false)`)),
    MUL: cat("add_mul", mksimple(0xa8, 8, `(_1) => exec_mul(_1, false)`)),
    POW2: cat("shift_logic", mksimple(0xae, 8, `(_1) => exec_pow2(_1, false)`)),
    AND: cat("shift_logic", mksimple(0xb0, 8, `(_1) => exec_and(_1, false)`)),
    OR: cat("shift_logic", mksimple(0xb1, 8, `(_1) => exec_or(_1, false)`)),
    XOR: cat("shift_logic", mksimple(0xb2, 8, `(_1) => exec_xor(_1, false)`)),
    NOT: cat("shift_logic", mksimple(0xb3, 8, `(_1) => exec_not(_1, false)`)),
    FITSX: effects(cat("shift_logic", mksimple(0xb600, 16, `(_1) => exec_fits(_1, false)`)), CanThrow()),
    UFITSX: effects(cat("shift_logic", mksimple(0xb601, 16, `(_1) => exec_ufits(_1, false)`)), CanThrow()),
    BITSIZE: cat("shift_logic", mksimple(0xb602, 16, `(_1) => exec_bitsize(_1, true, false)`)),
    UBITSIZE: cat("shift_logic", mksimple(0xb603, 16, `(_1) => exec_bitsize(_1, false, false)`)),
    MIN: cat("other_arith", mksimple(0xb608, 16, `(_1) => exec_minmax(_1, 2)`)),
    MAX: cat("other_arith", mksimple(0xb609, 16, `(_1) => exec_minmax(_1, 4)`)),
    MINMAX: cat("other_arith", mksimple(0xb60a, 16, `(_1) => exec_minmax(_1, 6)`)),
    ABS: cat("other_arith", mksimple(0xb60b, 16, `(_1) => exec_abs(_1, false)`)),
    QADD: cat("add_mul", mksimple(0xb7a0, 16, `(_1) => exec_add(_1, true)`)),
    QSUB: cat("add_mul", mksimple(0xb7a1, 16, `(_1) => exec_sub(_1, true)`)),
    QSUBR: cat("add_mul", mksimple(0xb7a2, 16, `(_1) => exec_subr(_1, true)`)),
    QNEGATE: cat("add_mul", mksimple(0xb7a3, 16, `(_1) => exec_negate(_1, true)`)),
    QINC: cat("add_mul", mksimple(0xb7a4, 16, `(_1) => exec_inc(_1, true)`)),
    QDEC: cat("add_mul", mksimple(0xb7a5, 16, `(_1) => exec_dec(_1, true)`)),
    QMUL: cat("add_mul", mksimple(0xb7a8, 16, `(_1) => exec_mul(_1, true)`)),
    QPOW2: cat("shift_logic", mksimple(0xb7ae, 16, `(_1) => exec_pow2(_1, true)`)),
    QAND: cat("shift_logic", mksimple(0xb7b0, 16, `(_1) => exec_and(_1, true)`)),
    QOR: cat("shift_logic", mksimple(0xb7b1, 16, `(_1) => exec_or(_1, true)`)),
    QXOR: cat("shift_logic", mksimple(0xb7b2, 16, `(_1) => exec_xor(_1, true)`)),
    QNOT: cat("shift_logic", mksimple(0xb7b3, 16, `(_1) => exec_not(_1, true)`)),
    QFITSX: cat("shift_logic", mksimple(0xb7b600, 24, `(_1) => exec_fits(_1, true)`)),
    QUFITSX: cat("shift_logic", mksimple(0xb7b601, 24, `(_1) => exec_ufits(_1, true)`)),
    QBITSIZE: cat("shift_logic", mksimple(0xb7b602, 24, `(_1) => exec_bitsize(_1, true, true)`)),
    QUBITSIZE: cat("shift_logic", mksimple(0xb7b603, 24, `(_1) => exec_bitsize(_1, false, true)`)),
    QMIN: cat("other_arith", mksimple(0xb7b608, 24, `(_1) => exec_minmax(_1, 3)`)),
    QMAX: cat("other_arith", mksimple(0xb7b609, 24, `(_1) => exec_minmax(_1, 5)`)),
    QMINMAX: cat("other_arith", mksimple(0xb7b60a, 24, `(_1) => exec_minmax(_1, 7)`)),
    QABS: cat("other_arith", mksimple(0xb7b60b, 24, `(_1) => exec_abs(_1, true)`)),
    SGN: cat("int_cmp", mksimple(0xb8, 8, `(_1) => exec_sgn(_1, 0x987, false, 'SGN')`)),
    LESS: cat("int_cmp", mksimple(0xb9, 8, `(_1) => exec_cmp(_1, 0x887, false, 'LESS')`)),
    EQUAL: cat("int_cmp", mksimple(0xba, 8, `(_1) => exec_cmp(_1, 0x878, false, 'EQUAL')`)),
    LEQ: cat("int_cmp", mksimple(0xbb, 8, `(_1) => exec_cmp(_1, 0x877, false, 'LEQ')`)),
    GREATER: cat("int_cmp", mksimple(0xbc, 8, `(_1) => exec_cmp(_1, 0x788, false, 'GREATER')`)),
    NEQ: cat("int_cmp", mksimple(0xbd, 8, `(_1) => exec_cmp(_1, 0x787, false, 'NEQ')`)),
    GEQ: cat("int_cmp", mksimple(0xbe, 8, `(_1) => exec_cmp(_1, 0x778, false, 'GEQ')`)),
    CMP: cat("int_cmp", mksimple(0xbf, 8, `(_1) => exec_cmp(_1, 0x987, false, 'CMP')`)),
    ISNAN: cat("int_cmp", mksimple(0xc4, 8, `exec_is_nan`)),
    CHKNAN: effects(cat("int_cmp", mksimple(0xc5, 8, `exec_chk_nan`)), CanThrow()),
    QSGN: cat("int_cmp", mksimple(0xb7b8, 16, `(_1) => exec_sgn(_1, 0x987, true, 'QSGN')`)),
    QLESS: cat("int_cmp", mksimple(0xb7b9, 16, `(_1) => exec_cmp(_1, 0x887, true, 'QLESS')`)),
    QEQUAL: cat("int_cmp", mksimple(0xb7ba, 16, `(_1) => exec_cmp(_1, 0x878, true, 'QEQUAL')`)),
    QLEQ: cat("int_cmp", mksimple(0xb7bb, 16, `(_1) => exec_cmp(_1, 0x877, true, 'QLEQ')`)),
    QGREATER: cat("int_cmp", mksimple(0xb7bc, 16, `(_1) => exec_cmp(_1, 0x788, true, 'QGREATER')`)),
    QNEQ: cat("int_cmp", mksimple(0xb7bd, 16, `(_1) => exec_cmp(_1, 0x787, true, 'QNEQ')`)),
    QGEQ: cat("int_cmp", mksimple(0xb7be, 16, `(_1) => exec_cmp(_1, 0x778, true, 'QGEQ')`)),
    QCMP: cat("int_cmp", mksimple(0xb7bf, 16, `(_1) => exec_cmp(_1, 0x987, true, 'QCMP')`)),
    SEMPTY: cat("cell_cmp", mksimple(0xc700, 16, `(_1) => exec_un_cs_cmp(_1, 'SEMPTY', (cs) => cs.empty() && !cs.size_refs())`)),
    SDEMPTY: cat("cell_cmp", mksimple(0xc701, 16, `(_1) => exec_un_cs_cmp(_1, 'SDEMPTY', (cs) => cs.empty())`)),
    SREMPTY: cat("cell_cmp", mksimple(0xc702, 16, `(_1) => exec_un_cs_cmp(_1, 'SREMPTY', (cs) => !cs.size_refs())`)),
    SDFIRST: cat("cell_cmp", mksimple(0xc703, 16, `(_1) => exec_un_cs_cmp(_1, 'SDFIRST', (cs) => cs.prefetch_long(1) == -1)`)),
    SDLEXCMP: cat("cell_cmp", mksimple(0xc704, 16, `(_1) => exec_ibin_cs_cmp(_1, 'SDLEXCMP', (cs1, cs2) => cs1.lex_cmp(cs2))`)),
    SDEQ: cat("cell_cmp", mksimple(0xc705, 16, `(_1) => exec_bin_cs_cmp(_1, 'SDEQ', (cs1, cs2) => !cs1.lex_cmp(cs2))`)),
    SDPFX: cat("cell_cmp", mksimple(0xc708, 16, `(_1) => exec_bin_cs_cmp(_1, 'SDPFX', (cs1, cs2) => cs1.is_prefix_of(cs2))`)),
    SDPFXREV: cat("cell_cmp", mksimple(0xc709, 16, `(_1) => exec_bin_cs_cmp(_1, 'SDPFXREV', (cs1, cs2) => cs2.is_prefix_of(cs1))`)),
    SDPPFX: cat("cell_cmp", mksimple(0xc70a, 16, `(_1) => exec_bin_cs_cmp(_1, 'SDPPFX', (cs1, cs2) => cs1.is_proper_prefix_of(cs2))`)),
    SDPPFXREV: cat("cell_cmp", mksimple(0xc70b, 16, `(_1) => exec_bin_cs_cmp(_1, 'SDPPFXREV', (cs1, cs2) => cs2.is_proper_prefix_of(cs1))`)),
    SDSFX: cat("cell_cmp", mksimple(0xc70c, 16, `(_1) => exec_bin_cs_cmp(_1, 'SDSFX', (cs1, cs2) => cs1.is_suffix_of(cs2))`)),
    SDSFXREV: cat("cell_cmp", mksimple(0xc70d, 16, `(_1) => exec_bin_cs_cmp(_1, 'SDSFXREV', (cs1, cs2) => cs2.is_suffix_of(cs1))`)),
    SDPSFX: cat("cell_cmp", mksimple(0xc70e, 16, `(_1) => exec_bin_cs_cmp(_1, 'SDPSFX', (cs1, cs2) => cs1.is_proper_suffix_of(cs2))`)),
    SDPSFXREV: cat("cell_cmp", mksimple(0xc70f, 16, `(_1) => exec_bin_cs_cmp(_1, 'SDPSFXREV', (cs1, cs2) => cs2.is_proper_suffix_of(cs1))`)),
    SDCNTLEAD0: cat("cell_cmp", mksimple(0xc710, 16, `(_1) => exec_iun_cs_cmp(_1, 'SDCNTLEAD0', (cs) => cs.count_leading(0))`)),
    SDCNTLEAD1: cat("cell_cmp", mksimple(0xc711, 16, `(_1) => exec_iun_cs_cmp(_1, 'SDCNTLEAD1', (cs) => cs.count_leading(1))`)),
    SDCNTTRAIL0: cat("cell_cmp", mksimple(0xc712, 16, `(_1) => exec_iun_cs_cmp(_1, 'SDCNTTRAIL0', (cs) => cs.count_trailing(0))`)),
    SDCNTTRAIL1: cat("cell_cmp", mksimple(0xc713, 16, `(_1) => exec_iun_cs_cmp(_1, 'SDCNTTRAIL1', (cs) => cs.count_trailing(1))`)),
    NEWC: cat("cell_serialize", mksimple(0xc8, 8, `exec_new_builder`)),
    ENDC: effects(cat("cell_serialize", mksimple(0xc9, 8, `exec_builder_to_cell`)), CellCreate()),

    // same as STBREFR
    ENDCST: effects(cat("cell_serialize", mksimple(0xcd, 8, `(_1) => exec_store_builder_as_ref_rev(_1, false)`)), CellCreate()),

    STBREF: effects(cat("cell_serialize", mksimple(0xcf11, 16, `(_1) => exec_store_builder_as_ref(_1, false)`)), CellCreate()),
    STB: cat("cell_serialize", mksimple(0xcf13, 16, `(_1) => exec_store_builder(_1, false)`)),
    STREFR: cat("cell_serialize", mksimple(0xcf14, 16, `(_1) => exec_store_ref_rev(_1, false)`)),
    STBREFR: cat("cell_serialize", mksimple(0xcf15, 16, `(_1) => exec_store_builder_as_ref_rev(_1, false)`)),
    STSLICER: cat("cell_serialize", mksimple(0xcf16, 16, `(_1) => exec_store_slice_rev(_1, false)`)),
    STBR: cat("cell_serialize", mksimple(0xcf17, 16, `(_1) => exec_store_builder_rev(_1, false)`)),
    STREFQ: cat("cell_serialize", mksimple(0xcf18, 16, `(_1) => exec_store_ref(_1, true)`)),
    STBREFQ: cat("cell_serialize", mksimple(0xcf19, 16, `(_1) => exec_store_builder_as_ref(_1, true)`)),
    STSLICEQ: cat("cell_serialize", mksimple(0xcf1a, 16, `(_1) => exec_store_slice(_1, true)`)),
    STBQ: cat("cell_serialize", mksimple(0xcf1b, 16, `(_1) => exec_store_builder(_1, true)`)),
    STREFRQ: cat("cell_serialize", mksimple(0xcf1c, 16, `(_1) => exec_store_ref_rev(_1, true)`)),
    STBREFRQ: cat("cell_serialize", mksimple(0xcf1d, 16, `(_1) => exec_store_builder_as_ref_rev(_1, true)`)),
    STSLICERQ: cat("cell_serialize", mksimple(0xcf1e, 16, `(_1) => exec_store_slice_rev(_1, true)`)),
    STBRQ: cat("cell_serialize", mksimple(0xcf1f, 16, `(_1) => exec_store_builder_rev(_1, true)`)),
    ENDXC: effects(cat("cell_serialize", mksimple(0xcf23, 16, `exec_builder_to_special_cell`)), CellCreate()),
    BDEPTH: cat("cell_serialize", mksimple(0xcf30, 16, `x => exec_int_builder_func(x, 'BDEPTH', b => b.get_depth())`)),
    BBITS: cat("cell_serialize", mksimple(0xcf31, 16, `x => exec_int_builder_func(x, 'BBITS', b => b.size())`)),
    BREFS: cat("cell_serialize", mksimple(0xcf32, 16, `x => exec_int_builder_func(x, 'BREFS', b => b.size_refs())`)),
    BBITREFS: cat("cell_serialize", mksimple(0xcf33, 16, `x => exec_2int_builder_func(x, 'BBITSREFS', b => [b.size(), b.size_refs()])`)),
    BREMBITS: cat("cell_serialize", mksimple(0xcf35, 16, `x => exec_int_builder_func(x, 'BREMBITS', b => b.remaining_bits())`)),
    BREMREFS: cat("cell_serialize", mksimple(0xcf36, 16, `x => exec_int_builder_func(x, 'BREMREFS', b => b.remaining_refs())`)),
    BREMBITREFS: cat("cell_serialize", mksimple(0xcf37, 16, `x => exec_2int_builder_func(x, 'BREMBITSREFS', b => [b.remaining_bits(), b.remaining_refs()])`)),
    BCHKREFS: effects(cat("cell_serialize", mksimple(0xcf3a, 16, `(_1) => exec_builder_chk_bits_refs(_1, 2)`)), CanThrow()),
    BCHKBITREFS: effects(cat("cell_serialize", mksimple(0xcf3b, 16, `(_1) => exec_builder_chk_bits_refs(_1, 3)`)), CanThrow()),
    BCHKREFSQ: cat("cell_serialize", mksimple(0xcf3e, 16, `(_1) => exec_builder_chk_bits_refs(_1, 6)`)),
    BCHKBITREFSQ: cat("cell_serialize", mksimple(0xcf3f, 16, `(_1) => exec_builder_chk_bits_refs(_1, 7)`)),
    STZEROES: cat("cell_serialize", mksimple(0xcf40, 16, `(_1) => exec_store_same(_1, 'STZEROES', 0)`)),
    STONES: cat("cell_serialize", mksimple(0xcf41, 16, `(_1) => exec_store_same(_1, 'STONES', 1)`)),
    STSAME: cat("cell_serialize", mksimple(0xcf42, 16, `(_1) => exec_store_same(_1, 'STSAME', -1)`)),
    CTOS: effects(cat("cell_deserialize", mksimple(0xd0, 8, `exec_cell_to_slice`)), CellLoad()),
    ENDS: cat("cell_deserialize", mksimple(0xd1, 8, `exec_slice_chk_empty`)),
    LDREF: cat("cell_deserialize", mksimple(0xd4, 8, `(_1) => exec_load_ref(_1, 0)`)),
    LDREFRTOS: effects(cat("cell_deserialize", mksimple(0xd5, 8, `(_1) => exec_load_ref_rev_to_slice(_1, 0)`)), CellLoad()),
    SDCUTFIRST: cat("cell_deserialize", mksimple(0xd720, 16, `x => exec_slice_op_args(x, 'SDCUTFIRST', 1023, (cs, bits) => cs.only_first(bits))`)),
    SDSKIPFIRST: cat("cell_deserialize", mksimple(0xd721, 16, `x => exec_slice_op_args(x, 'SDSKIPFIRST', 1023, (cs, bits) => cs.skip_first(bits))`)),
    SDCUTLAST: cat("cell_deserialize", mksimple(0xd722, 16, `x => exec_slice_op_args(x, 'SDCUTLAST', 1023, (cs, bits) => cs.only_last(bits))`)),
    SDSKIPLAST: cat("cell_deserialize", mksimple(0xd723, 16, `x => exec_slice_op_args(x, 'SDSKIPLAST', 1023, (cs, bits) => cs.skip_last(bits))`)),
    SDSUBSTR: cat("cell_deserialize", mksimple(0xd724, 16, `x => exec_slice_op_args2(x, 'SDSUBSTR', 1023, 1023, (cs, offs, bits) => cs.skip_first(offs) && cs.only_first(bits))`)),
    SCUTFIRST: cat("cell_deserialize", mksimple(0xd730, 16, `x => exec_slice_op_args2(x, 'SCUTFIRST', 1023, 4, (cs, bits, refs) => cs.only_first(bits, refs))`)),
    SSKIPFIRST: cat("cell_deserialize", mksimple(0xd731, 16, `x => exec_slice_op_args2(x, 'SSKIPFIRST', 1023, 4, (cs, bits, refs) => cs.skip_first(bits, refs))`)),
    SCUTLAST: cat("cell_deserialize", mksimple(0xd732, 16, `x => exec_slice_op_args2(x, 'SCUTLAST', 1023, 4, (cs, bits, refs) => cs.only_last(bits, refs))`)),
    SSKIPLAST: cat("cell_deserialize", mksimple(0xd733, 16, `x => exec_slice_op_args2(x, 'SSKIPLAST', 1023, 4, (cs, bits, refs) => cs.skip_last(bits, refs))`)),
    SUBSLICE: cat("cell_deserialize", mksimple(0xd734, 16, `exec_subslice`)),
    SPLIT: cat("cell_deserialize", mksimple(0xd736, 16, `(_1) => exec_split(_1, false)`)),
    SPLITQ: cat("cell_deserialize", mksimple(0xd737, 16, `(_1) => exec_split(_1, true)`)),
    XCTOS: cat("cell_deserialize", mksimple(0xd739, 16, `exec_cell_to_slice_maybe_special`)),
    XLOAD: cat("cell_deserialize", mksimple(0xd73a, 16, `(_1) => exec_load_special_cell(_1, false)`)),
    XLOADQ: cat("cell_deserialize", mksimple(0xd73b, 16, `(_1) => exec_load_special_cell(_1, true)`)),
    SCHKBITS: effects(cat("cell_deserialize", mksimple(0xd741, 16, `x => exec_slice_chk_op_args(x, 'SCHKBITS', 1023, false, (cs, bits) => cs.have(bits))`)), CanThrow()),
    SCHKREFS: effects(cat("cell_deserialize", mksimple(0xd742, 16, `x => exec_slice_chk_op_args(x, 'SCHKREFS', 1023, false, (cs, refs) => cs.have_refs(refs))`)), CanThrow()),
    SCHKBITREFS: effects(cat("cell_deserialize", mksimple(0xd743, 16, `x => exec_slice_chk_op_args2(x, 'SCHKBITREFS', 1023, 4, false, (cs, bits, refs) => cs.have(bits) && cs.have_refs(refs))`)), CanThrow()),
    SCHKBITSQ: cat("cell_deserialize", mksimple(0xd745, 16, `x => exec_slice_chk_op_args(x, 'SCHKBITSQ', 1023, true, (cs, bits) => cs.have(bits))`)),
    SCHKREFSQ: cat("cell_deserialize", mksimple(0xd746, 16, `x => exec_slice_chk_op_args(x, 'SCHKREFSQ', 1023, true, (cs, refs) => cs.have_refs(refs))`)),
    SCHKBITREFSQ: cat("cell_deserialize", mksimple(0xd747, 16, `x => exec_slice_chk_op_args2(x, 'SCHKBITREFSQ', 1023, 4, true, (cs, bits, refs) => cs.have(bits) && cs.have_refs(refs))`)),
    PLDREFVAR: cat("cell_deserialize", mksimple(0xd748, 16, `exec_preload_ref`)),
    SBITS: cat("cell_deserialize", mksimple(0xd749, 16, `(_1) => exec_slice_bits_refs(_1, 1)`)),
    SREFS: cat("cell_deserialize", mksimple(0xd74a, 16, `(_1) => exec_slice_bits_refs(_compute_len_slice_begins_with_const1, 2)`)),
    SBITREFS: cat("cell_deserialize", mksimple(0xd74b, 16, `(_1) => exec_slice_bits_refs(_1, 3)`)),
    LDZEROES: cat("cell_deserialize", mksimple(0xd760, 16, `(_1) => exec_load_same(_1, 'LDZEROES', 0)`)),
    LDONES: cat("cell_deserialize", mksimple(0xd761, 16, `(_1) => exec_load_same(_1, 'LDONES', 1)`)),
    LDSAME: cat("cell_deserialize", mksimple(0xd762, 16, `(_1) => exec_load_same(_1, 'LDSAME', -1)`)),
    SDEPTH: cat("cell_deserialize", mksimple(0xd764, 16, `exec_slice_depth`)),
    CDEPTH: cat("cell_deserialize", mksimple(0xd765, 16, `exec_cell_depth`)),
    CLEVEL: version(6, cat("cell_deserialize", mksimple(0xd766, 16, `exec_cell_level`))),
    CLEVELMASK: version(6, cat("cell_deserialize", mksimple(0xd767, 16, `exec_cell_level_mask`))),
    CHASHIX: version(6, cat("cell_deserialize", mksimple(0xd770, 16, ` (_1) => exec_cell_hash_i(_1, 0, true)`))),
    CDEPTHIX: version(6, cat("cell_deserialize", mksimple(0xd771, 16, ` (_1) => exec_cell_depth_i(_1, 0, true)`))),
    EXECUTE: cat("continuation_jump", mksimple(0xd8, 8, `exec_execute`)),
    JMPX: cat("continuation_jump", mksimple(0xd9, 8, `exec_jmpx`)),
    RET: cat("continuation_jump", mksimple(0xdb30, 16, `exec_ret`)),
    RETALT: cat("continuation_jump", mksimple(0xdb31, 16, `exec_ret_alt`)),
    RETBOOL: cat("continuation_jump", mksimple(0xdb32, 16, `exec_ret_bool`)),
    CALLCC: cat("continuation_jump", mksimple(0xdb34, 16, `exec_callcc`)),
    JMPXDATA: cat("continuation_jump", mksimple(0xdb35, 16, `exec_jmpx_data`)),
    CALLXVARARGS: cat("continuation_jump", mksimple(0xdb38, 16, `exec_callx_varargs`)),
    RETVARARGS: cat("continuation_jump", mksimple(0xdb39, 16, `exec_ret_varargs`)),
    JMPXVARARGS: cat("continuation_jump", mksimple(0xdb3a, 16, `exec_jmpx_varargs`)),
    CALLCCVARARGS: cat("continuation_jump", mksimple(0xdb3b, 16, `exec_callcc_varargs`)),
    RETDATA: cat("continuation_jump", mksimple(0xdb3f, 16, `exec_ret_data`)),
    RUNVMX: version(4, cat("continuation_jump", mksimple(0xdb50, 16, ` exec_runvmx`))),
    IFRET: cat("continuation_cond_loop", mksimple(0xdc, 8, `exec_ifret`)),
    IFNOTRET: cat("continuation_cond_loop", mksimple(0xdd, 8, `exec_ifnotret`)),
    IF: cat("continuation_cond_loop", mksimple(0xde, 8, `exec_if`)),
    IFNOT: cat("continuation_cond_loop", mksimple(0xdf, 8, `exec_ifnot`)),
    IFJMP: cat("continuation_cond_loop", mksimple(0xe0, 8, `exec_if_jmp`)),
    IFNOTJMP: cat("continuation_cond_loop", mksimple(0xe1, 8, `exec_ifnot_jmp`)),
    IFELSE: cat("continuation_cond_loop", mksimple(0xe2, 8, `exec_if_else`)),
    CONDSEL: cat("continuation_cond_loop", mksimple(0xe304, 16, `exec_condsel`)),
    CONDSELCHK: cat("continuation_cond_loop", mksimple(0xe305, 16, `exec_condsel_chk`)),
    IFRETALT: cat("continuation_cond_loop", mksimple(0xe308, 16, `exec_ifretalt`)),
    IFNOTRETALT: cat("continuation_cond_loop", mksimple(0xe309, 16, `exec_ifnotretalt`)),
    REPEAT: cat("continuation_cond_loop", mksimple(0xe4, 8, `(_1) => exec_repeat(_1, false)`)),
    REPEATEND: cat("continuation_cond_loop", mksimple(0xe5, 8, `(_1) => exec_repeat_end(_1, false)`)),
    UNTIL: cat("continuation_cond_loop", mksimple(0xe6, 8, `(_1) => exec_until(_1, false)`)),
    UNTILEND: cat("continuation_cond_loop", mksimple(0xe7, 8, `(_1) => exec_until_end(_1, false)`)),
    WHILE: cat("continuation_cond_loop", mksimple(0xe8, 8, `(_1) => exec_while(_1, false)`)),
    WHILEEND: cat("continuation_cond_loop", mksimple(0xe9, 8, `(_1) => exec_while_end(_1, false)`)),
    AGAIN: cat("continuation_cond_loop", mksimple(0xea, 8, `(_1) => exec_again(_1, false)`)),
    AGAINEND: cat("continuation_cond_loop", mksimple(0xeb, 8, `(_1) => exec_again_end(_1, false)`)),
    REPEATBRK: cat("continuation_cond_loop", mksimple(0xe314, 16, `(_1) => exec_repeat(_1, true)`)),
    REPEATENDBRK: cat("continuation_cond_loop", mksimple(0xe315, 16, `(_1) => exec_repeat_end(_1, true)`)),
    UNTILBRK: cat("continuation_cond_loop", mksimple(0xe316, 16, `(_1) => exec_until(_1, true)`)),
    UNTILENDBRK: cat("continuation_cond_loop", mksimple(0xe317, 16, `(_1) => exec_until_end(_1, true)`)),
    WHILEBRK: cat("continuation_cond_loop", mksimple(0xe318, 16, `(_1) => exec_while(_1, true)`)),
    WHILEENDBRK: cat("continuation_cond_loop", mksimple(0xe319, 16, `(_1) => exec_while_end(_1, true)`)),
    AGAINBRK: cat("continuation_cond_loop", mksimple(0xe31a, 16, `(_1) => exec_again(_1, true)`)),
    AGAINENDBRK: cat("continuation_cond_loop", mksimple(0xe31b, 16, `(_1) => exec_again_end(_1, true)`)),
    RETURNVARARGS: cat("continuation_change", mksimple(0xed10, 16, `exec_return_varargs`)),
    SETCONTVARARGS: cat("continuation_change", mksimple(0xed11, 16, `exec_setcont_varargs`)),
    SETNUMVARARGS: cat("continuation_change", mksimple(0xed12, 16, `exec_setnum_varargs`)),
    BLESS: cat("continuation_change", mksimple(0xed1e, 16, `exec_bless`)),
    BLESSVARARGS: cat("continuation_change", mksimple(0xed1f, 16, `exec_bless_varargs`)),

    PUSHCTRX: cat("continuation_change", mksimple(0xede0, 16, `exec_push_ctr_var`)),
    POPCTRX: cat("continuation_change", mksimple(0xede1, 16, `exec_pop_ctr_var`)),
    SETCONTCTRX: cat("continuation_change", mksimple(0xede2, 16, `exec_setcont_ctr_var`)),
    SETCONTCTRMANYX: version(9, cat("continuation_change", mksimple(0xede4, 16, `exec_setcont_ctr_many_var`))),
    BOOLAND: cat("continuation_change", mksimple(0xedf0, 16, `(_1) => exec_compos(_1, 1, 'BOOLAND')`)),
    BOOLOR: cat("continuation_change", mksimple(0xedf1, 16, `(_1) => exec_compos(_1, 2, 'BOOLOR')`)),
    COMPOSBOTH: cat("continuation_change", mksimple(0xedf2, 16, `(_1) => exec_compos(_1, 3, 'COMPOSBOTH')`)),
    ATEXIT: cat("continuation_change", mksimple(0xedf3, 16, `exec_atexit`)),
    ATEXITALT: cat("continuation_change", mksimple(0xedf4, 16, `exec_atexit_alt`)),
    SETEXITALT: cat("continuation_change", mksimple(0xedf5, 16, `exec_setexit_alt`)),
    THENRET: cat("continuation_change", mksimple(0xedf6, 16, `exec_thenret`)),
    THENRETALT: cat("continuation_change", mksimple(0xedf7, 16, `exec_thenret_alt`)),
    INVERT: cat("continuation_change", mksimple(0xedf8, 16, `exec_invert`)),
    BOOLEVAL: cat("continuation_change", mksimple(0xedf9, 16, `exec_booleval`)),
    SAMEALT: cat("continuation_change", mksimple(0xedfa, 16, `(_1) => exec_samealt(_1, false)`)),
    SAMEALTSAVE: cat("continuation_change", mksimple(0xedfb, 16, `(_1) => exec_samealt(_1, true)`)),
    TRY: cat("exception", mksimple(0xf2ff, 16, `(_1) => exec_try(_1, -1)`)),

    STDICT: cat("dictionary", mksimple(0xf400, 16, `exec_store_dict`)),
    SKIPDICT: cat("dictionary", mksimple(0xf401, 16, `exec_skip_dict`)),
    LDDICTS: cat("dictionary", mksimple(0xf402, 16, `(_1) => exec_load_dict_slice(_1, 0)`)),
    PLDDICTS: cat("dictionary", mksimple(0xf403, 16, `(_1) => exec_load_dict_slice(_1, 1)`)),
    LDDICT: cat("dictionary", mksimple(0xf404, 16, `(_1) => exec_load_dict(_1, 0)`)),
    PLDDICT: cat("dictionary", mksimple(0xf405, 16, `(_1) => exec_load_dict(_1, 1)`)),
    LDDICTQ: cat("dictionary", mksimple(0xf406, 16, `(_1) => exec_load_dict(_1, 2)`)),
    PLDDICTQ: cat("dictionary", mksimple(0xf407, 16, `(_1) => exec_load_dict(_1, 3)`)),
    PFXDICTSET: cat("dictionary", mksimple(0xf470, 16, `(_1) => exec_pfx_dict_set(_1, Set, 'SET')`)),
    PFXDICTREPLACE: cat("dictionary", mksimple(0xf471, 16, `(_1) => exec_pfx_dict_set(_1, Replace, 'REPLACE')`)),
    PFXDICTADD: cat("dictionary", mksimple(0xf472, 16, `(_1) => exec_pfx_dict_set(_1, Add, 'ADD')`)),
    PFXDICTDEL: cat("dictionary", mksimple(0xf473, 16, `exec_pfx_dict_delete`)),
    PFXDICTGETQ: cat("dictionary", mksimple(0xf4a8, 16, `(_1) => exec_pfx_dict_get(_1, 0, 'Q')`)),
    PFXDICTGET: cat("dictionary", mksimple(0xf4a9, 16, `(_1) => exec_pfx_dict_get(_1, 1, '')`)),
    PFXDICTGETJMP: cat("dictionary", mksimple(0xf4aa, 16, `(_1) => exec_pfx_dict_get(_1, 2, 'JMP')`)),
    PFXDICTGETEXEC: cat("dictionary", mksimple(0xf4ab, 16, `(_1) => exec_pfx_dict_get(_1, 3, 'EXEC')`)),
    NOP: cat("stack", mksimple(0x00, 8, `exec_nop`)),
    SWAP: cat("stack", mksimple(0x01, 8, `exec_swap`)),
    DUP: cat("stack", mksimple(0x20, 8, `exec_dup`)),
    OVER: cat("stack", mksimple(0x21, 8, `exec_over`)),
    DROP: cat("stack", mksimple(0x30, 8, `exec_drop`)),
    NIP: cat("stack", mksimple(0x31, 8, `exec_nip`)),
    ROT: cat("stack", mksimple(0x58, 8, `exec_rot`)),
    ROTREV: cat("stack", mksimple(0x59, 8, `exec_rotrev`)),
    PICK: cat("stack", mksimple(0x60, 8, `exec_pick`)),
    ROLL: cat("stack", mksimple(0x61, 8, `exec_roll`)),
    ROLLREV: cat("stack", mksimple(0x62, 8, `exec_rollrev`)),
    BLKSWX: cat("stack", mksimple(0x63, 8, `exec_blkswap_x`)),
    REVX: cat("stack", mksimple(0x64, 8, `exec_reverse_x`)),
    DROPX: cat("stack", mksimple(0x65, 8, `exec_drop_x`)),
    TUCK: cat("stack", mksimple(0x66, 8, `exec_tuck`)),
    XCHGX: cat("stack", mksimple(0x67, 8, `exec_xchg_x`)),
    DEPTH: cat("stack", mksimple(0x68, 8, `exec_depth`)),
    CHKDEPTH: effects(cat("stack", mksimple(0x69, 8, `exec_chkdepth`)), CanThrow()),
    ONLYTOPX: cat("stack", mksimple(0x6a, 8, `exec_onlytop_x`)),
    ONLYX: cat("stack", mksimple(0x6b, 8, `exec_only_x`)),
    ACCEPT: cat("basic_gas", mksimple(0xf800, 16, `exec_accept`)),
    SETGASLIMIT: cat("basic_gas", mksimple(0xf801, 16, `exec_set_gas_limit`)),
    GASCONSUMED: version(4, cat("basic_gas", mksimple(0xf807, 16, `exec_gas_consumed`))),
    COMMIT: cat("basic_gas", mksimple(0xf80f, 16, `exec_commit`)),
    NOW: cat("config", mksimple(0xf823, 16, `(_1) => exec_get_param(_1, 3, 'NOW')`)),
    BLOCKLT: cat("config", mksimple(0xf824, 16, `(_1) => exec_get_param(_1, 4, 'BLOCKLT')`)),
    LTIME: cat("config", mksimple(0xf825, 16, `(_1) => exec_get_param(_1, 5, 'LTIME')`)),
    RANDSEED: cat("config", mksimple(0xf826, 16, `(_1) => exec_get_param(_1, 6, 'RANDSEED')`)),
    BALANCE: cat("config", mksimple(0xf827, 16, `(_1) => exec_get_param(_1, 7, 'BALANCE')`)),
    MYADDR: cat("config", mksimple(0xf828, 16, `(_1) => exec_get_param(_1, 8, 'MYADDR')`)),
    CONFIGROOT: cat("config", mksimple(0xf829, 16, `(_1) => exec_get_param(_1, 9, 'CONFIGROOT')`)),
    MYCODE: cat("config", mksimple(0xf82a, 16, `(_1) => exec_get_param(_1, 10, 'MYCODE')`)),
    INCOMINGVALUE: cat("config", mksimple(0xf82b, 16, `(_1) => exec_get_param(_1, 11, 'INCOMINGVALUE')`)),
    STORAGEFEES: cat("config", mksimple(0xf82c, 16, `(_1) => exec_get_param(_1, 12, 'STORAGEFEES')`)),
    PREVBLOCKSINFOTUPLE: cat("config", mksimple(0xf82d, 16, `(_1) => exec_get_param(_1, 13, 'PREVBLOCKSINFOTUPLE')`)),
    UNPACKEDCONFIGTUPLE: cat("config", mksimple(0xf82e, 16, `(_1) => exec_get_param(_1, 14, 'UNPACKEDCONFIGTUPLE')`)),
    DUEPAYMENT: cat("config", mksimple(0xf82f, 16, `(_1) => exec_get_param(_1, 15, 'DUEPAYMENT')`)),
    CONFIGDICT: cat("config", mksimple(0xf830, 16, `exec_get_config_dict`)),
    CONFIGPARAM: cat("config", mksimple(0xf832, 16, `(_1) => exec_get_config_param(_1, false)`)),
    CONFIGOPTPARAM: cat("config", mksimple(0xf833, 16, `(_1) => exec_get_config_param(_1, true)`)),
    PREVMCBLOCKS: version(4, cat("config", mksimple(0xf83400, 24, `(_1) => exec_get_prev_blocks_info(_1, 0, 'PREVMCBLOCKS')`))),
    PREVKEYBLOCK: version(4, cat("config", mksimple(0xf83401, 24, `(_1) => exec_get_prev_blocks_info(_1, 1, 'PREVKEYBLOCK')`))),
    PREVMCBLOCKS_100: version(9, cat("config", mksimple(0xf83402, 24, `(_1) => exec_get_prev_blocks_info(_1, 2, 'PREVMCBLOCKS_100')`))),
    GLOBALID: version(4, cat("config", mksimple(0xf835, 16, `exec_get_global_id`))),
    GETGASFEE: version(6, cat("config", mksimple(0xf836, 16, `exec_get_gas_fee`))),
    GETSTORAGEFEE: version(6, cat("config", mksimple(0xf837, 16, `exec_get_storage_fee`))),
    GETFORWARDFEE: version(6, cat("config", mksimple(0xf838, 16, `exec_get_forward_fee`))),
    GETPRECOMPILEDGAS: version(6, cat("config", mksimple(0xf839, 16, `exec_get_precompiled_gas`))),
    GETORIGINALFWDFEE: version(6, cat("config", mksimple(0xf83a, 16, `exec_get_original_fwd_fee`))),
    GETGASFEESIMPLE: version(6, cat("config", mksimple(0xf83b, 16, `exec_get_gas_fee_simple`))),
    GETFORWARDFEESIMPLE: version(6, cat("config", mksimple(0xf83c, 16, `exec_get_forward_fee_simple`))),
    GETGLOBVAR: cat("config", mksimple(0xf840, 16, `exec_get_global_var`)),
    SETGLOBVAR: cat("config", mksimple(0xf860, 16, `exec_set_global_var`)),
    RANDU256: cat("prng", mksimple(0xf810, 16, `exec_randu256`)),
    RAND: cat("prng", mksimple(0xf811, 16, `exec_rand_int`)),
    SETRAND: cat("prng", mksimple(0xf814, 16, `(_1) => exec_set_rand(_1, false)`)),
    ADDRAND: cat("prng", mksimple(0xf815, 16, `(_1) => exec_set_rand(_1, true)`)),
    HASHCU: cat("crypto", mksimple(0xf900, 16, `(_1) => exec_compute_hash(_1, 0)`)),
    HASHSU: effects(cat("crypto", mksimple(0xf901, 16, `(_1) => exec_compute_hash(_1, 1)`)), CellCreate()),
    SHA256U: cat("crypto", mksimple(0xf902, 16, `exec_compute_sha256`)),
    CHKSIGNU: cat("crypto", mksimple(0xf910, 16, `(_1) => exec_ed25519_check_signature(_1, false)`)),
    CHKSIGNS: cat("crypto", mksimple(0xf911, 16, `(_1) => exec_ed25519_check_signature(_1, true)`)),
    ECRECOVER: version(4, cat("crypto", mksimple(0xf912, 16, `exec_ecrecover`))),
    SECP256K1_XONLY_PUBKEY_TWEAK_ADD: version(9, cat("crypto", mksimple(0xf913, 16, `exec_secp256k1_xonly_pubkey_tweak_add`))),
    P256_CHKSIGNU: version(4, cat("crypto", mksimple(0xf914, 16, `(_1) => exec_p256_chksign(_1, false)`))),
    P256_CHKSIGNS: version(4, cat("crypto", mksimple(0xf915, 16, `(_1) => exec_p256_chksign(_1, true)`))),
    RIST255_FROMHASH: version(4, cat("crypto", mksimple(0xf920, 16, `exec_ristretto255_from_hash`))),
    RIST255_VALIDATE: version(4, cat("crypto", mksimple(0xf921, 16, `(_1) => exec_ristretto255_validate(_1, false)`))),
    RIST255_ADD: version(4, cat("crypto", mksimple(0xf922, 16, `(_1) => exec_ristretto255_add(_1, false)`))),
    RIST255_SUB: version(4, cat("crypto", mksimple(0xf923, 16, `(_1) => exec_ristretto255_sub(_1, false)`))),
    RIST255_MUL: version(4, cat("crypto", mksimple(0xf924, 16, `(_1) => exec_ristretto255_mul(_1, false)`))),
    RIST255_MULBASE: version(4, cat("crypto", mksimple(0xf925, 16, `(_1) => exec_ristretto255_mul_base(_1, false)`))),
    RIST255_PUSHL: version(4, cat("crypto", mksimple(0xf926, 16, `exec_ristretto255_push_l`))),
    RIST255_QVALIDATE: version(4, cat("crypto", mksimple(0xb7f921, 24, `(_1) => exec_ristretto255_validate(_1, true)`))),
    RIST255_QADD: version(4, cat("crypto", mksimple(0xb7f922, 24, `(_1) => exec_ristretto255_add(_1, true)`))),
    RIST255_QSUB: version(4, cat("crypto", mksimple(0xb7f923, 24, `(_1) => exec_ristretto255_sub(_1, true)`))),
    RIST255_QMUL: version(4, cat("crypto", mksimple(0xb7f924, 24, `(_1) => exec_ristretto255_mul(_1, true)`))),
    RIST255_QMULBASE: version(4, cat("crypto", mksimple(0xb7f925, 24, `(_1) => exec_ristretto255_mul_base(_1, true)`))),
    BLS_VERIFY: version(4, cat("crypto", mksimple(0xf93000, 24, `exec_bls_verify`))),
    BLS_AGGREGATE: version(4, cat("crypto", mksimple(0xf93001, 24, `exec_bls_aggregate`))),
    BLS_FASTAGGREGATEVERIFY: version(4, cat("crypto", mksimple(0xf93002, 24, `exec_bls_fast_aggregate_verify`))),
    BLS_AGGREGATEVERIFY: version(4, cat("crypto", mksimple(0xf93003, 24, `exec_bls_aggregate_verify`))),
    BLS_G1_ADD: version(4, cat("crypto", mksimple(0xf93010, 24, `exec_bls_g1_add`))),
    BLS_G1_SUB: version(4, cat("crypto", mksimple(0xf93011, 24, `exec_bls_g1_sub`))),
    BLS_G1_NEG: version(4, cat("crypto", mksimple(0xf93012, 24, `exec_bls_g1_neg`))),
    BLS_G1_MUL: version(4, cat("crypto", mksimple(0xf93013, 24, `exec_bls_g1_mul`))),
    BLS_G1_MULTIEXP: version(4, cat("crypto", mksimple(0xf93014, 24, `exec_bls_g1_multiexp`))),
    BLS_G1_ZERO: version(4, cat("crypto", mksimple(0xf93015, 24, `exec_bls_g1_zero`))),
    BLS_MAP_TO_G1: version(4, cat("crypto", mksimple(0xf93016, 24, `exec_bls_map_to_g1`))),
    BLS_G1_INGROUP: version(4, cat("crypto", mksimple(0xf93017, 24, `exec_bls_g1_in_group`))),
    BLS_G1_ISZERO: version(4, cat("crypto", mksimple(0xf93018, 24, `exec_bls_g1_is_zero`))),
    BLS_G2_ADD: version(4, cat("crypto", mksimple(0xf93020, 24, `exec_bls_g2_add`))),
    BLS_G2_SUB: version(4, cat("crypto", mksimple(0xf93021, 24, `exec_bls_g2_sub`))),
    BLS_G2_NEG: version(4, cat("crypto", mksimple(0xf93022, 24, `exec_bls_g2_neg`))),
    BLS_G2_MUL: version(4, cat("crypto", mksimple(0xf93023, 24, `exec_bls_g2_mul`))),
    BLS_G2_MULTIEXP: version(4, cat("crypto", mksimple(0xf93024, 24, `exec_bls_g2_multiexp`))),
    BLS_G2_ZERO: version(4, cat("crypto", mksimple(0xf93025, 24, `exec_bls_g2_zero`))),
    BLS_MAP_TO_G2: version(4, cat("crypto", mksimple(0xf93026, 24, `exec_bls_map_to_g2`))),
    BLS_G2_INGROUP: version(4, cat("crypto", mksimple(0xf93027, 24, `exec_bls_g2_in_group`))),
    BLS_G2_ISZERO: version(4, cat("crypto", mksimple(0xf93028, 24, `exec_bls_g2_is_zero`))),
    BLS_PAIRING: version(4, cat("crypto", mksimple(0xf93030, 24, `exec_bls_pairing`))),
    BLS_PUSHR: version(4, cat("crypto", mksimple(0xf93031, 24, `exec_bls_push_r`))),
    CDATASIZEQ: cat("misc", mksimple(0xf940, 16, `(_1) => exec_compute_data_size(_1, 1)`)),
    CDATASIZE: cat("misc", mksimple(0xf941, 16, `(_1) => exec_compute_data_size(_1, 0)`)),
    SDATASIZEQ: cat("misc", mksimple(0xf942, 16, `(_1) => exec_compute_data_size(_1, 3)`)),
    SDATASIZE: cat("misc", mksimple(0xf943, 16, `(_1) => exec_compute_data_size(_1, 2)`)),
    LDGRAMS: cat("address", mksimple(0xfa00, 16, `(_1) => exec_load_var_integer(_1, 4, false, false)`)),
    LDVARINT16: cat("address", mksimple(0xfa01, 16, `(_1) => exec_load_var_integer(_1, 4, true, false)`)),
    STGRAMS: cat("address", mksimple(0xfa02, 16, `(_1) => exec_store_var_integer(_1, 4, false, false)`)),
    STVARINT16: cat("address", mksimple(0xfa03, 16, `(_1) => exec_store_var_integer(_1, 4, true, false)`)),
    LDVARUINT32: cat("address", mksimple(0xfa04, 16, `(_1) => exec_load_var_integer(_1, 5, false, false)`)),
    LDVARINT32: cat("address", mksimple(0xfa05, 16, `(_1) => exec_load_var_integer(_1, 5, true, false)`)),
    STVARUINT32: cat("address", mksimple(0xfa06, 16, `(_1) => exec_store_var_integer(_1, 5, false, false)`)),
    STVARINT32: cat("address", mksimple(0xfa07, 16, `(_1) => exec_store_var_integer(_1, 5, true, false)`)),
    LDMSGADDR: cat("address", mksimple(0xfa40, 16, `(_1) => exec_load_message_addr(_1, false)`)),
    LDMSGADDRQ: cat("address", mksimple(0xfa41, 16, `(_1) => exec_load_message_addr(_1, true)`)),
    PARSEMSGADDR: cat("address", mksimple(0xfa42, 16, `(_1) => exec_parse_message_addr(_1, false)`)),
    PARSEMSGADDRQ: cat("address", mksimple(0xfa43, 16, `(_1) => exec_parse_message_addr(_1, true)`)),
    REWRITESTDADDR: cat("address", mksimple(0xfa44, 16, `(_1) => exec_rewrite_message_addr(_1, false, false)`)),
    REWRITESTDADDRQ: cat("address", mksimple(0xfa45, 16, `(_1) => exec_rewrite_message_addr(_1, false, true)`)),
    REWRITEVARADDR: cat("address", mksimple(0xfa46, 16, `(_1) => exec_rewrite_message_addr(_1, true, false)`)),
    REWRITEVARADDRQ: cat("address", mksimple(0xfa47, 16, `(_1) => exec_rewrite_message_addr(_1, true, true)`)),
    SENDRAWMSG: cat("message", mksimple(0xfb00, 16, `exec_send_raw_message`)),
    RAWRESERVE: cat("message", mksimple(0xfb02, 16, `(_1) => exec_reserve_raw(_1, 0)`)),
    RAWRESERVEX: cat("message", mksimple(0xfb03, 16, `(_1) => exec_reserve_raw(_1, 1)`)),
    SETCODE: cat("message", mksimple(0xfb04, 16, `exec_set_code`)),
    SETLIBCODE: cat("message", mksimple(0xfb06, 16, `exec_set_lib_code`)),
    CHANGELIB: cat("message", mksimple(0xfb07, 16, `exec_change_lib`)),
    SENDMSG: version(4, cat("message", mksimple(0xfb08, 16, `exec_send_message`))),
    PUSHNULL: cat("tuple", mksimple(0x6d, 8, `exec_push_null`)),
    ISNULL: cat("tuple", mksimple(0x6e, 8, `exec_is_null`)),
    TUPLEVAR: cat("tuple", mksimple(0x6f80, 16, `exec_mktuple_var`)),
    INDEXVAR: cat("tuple", mksimple(0x6f81, 16, `exec_tuple_index_var`)),
    UNTUPLEVAR: cat("tuple", mksimple(0x6f82, 16, `exec_untuple_var`)),
    UNPACKFIRSTVAR: cat("tuple", mksimple(0x6f83, 16, `exec_untuple_first_var`)),
    EXPLODEVAR: cat("tuple", mksimple(0x6f84, 16, `exec_explode_tuple_var`)),
    SETINDEXVAR: cat("tuple", mksimple(0x6f85, 16, `exec_tuple_set_index_var`)),
    INDEXVARQ: cat("tuple", mksimple(0x6f86, 16, `exec_tuple_quiet_index_var`)),
    SETINDEXVARQ: cat("tuple", mksimple(0x6f87, 16, `exec_tuple_quiet_set_index_var`)),
    TLEN: cat("tuple", mksimple(0x6f88, 16, `exec_tuple_length`)),
    QTLEN: cat("tuple", mksimple(0x6f89, 16, `exec_tuple_length_quiet`)),
    ISTUPLE: cat("tuple", mksimple(0x6f8a, 16, `exec_is_tuple`)),
    LAST: cat("tuple", mksimple(0x6f8b, 16, `exec_tuple_last`)),
    TPUSH: cat("tuple", mksimple(0x6f8c, 16, `exec_tuple_push`)),
    TPOP: cat("tuple", mksimple(0x6f8d, 16, `exec_tuple_pop`)),
    NULLSWAPIF: cat("tuple", mksimple(0x6fa0, 16, `(_1) => exec_null_swap_if(_1, true, 0)`)),
    NULLSWAPIFNOT: cat("tuple", mksimple(0x6fa1, 16, `(_1) => exec_null_swap_if(_1, false, 0)`)),
    NULLROTRIF: cat("tuple", mksimple(0x6fa2, 16, `(_1) => exec_null_swap_if(_1, true, 1)`)),
    NULLROTRIFNOT: cat("tuple", mksimple(0x6fa3, 16, `(_1) => exec_null_swap_if(_1, false, 1)`)),
    NULLSWAPIF2: cat("tuple", mksimple(0x6fa4, 16, `(_1) => exec_null_swap_if_many(_1, true, 0, 2)`)),
    NULLSWAPIFNOT2: cat("tuple", mksimple(0x6fa5, 16, `(_1) => exec_null_swap_if_many(_1, false, 0, 2)`)),
    NULLROTRIF2: cat("tuple", mksimple(0x6fa6, 16, `(_1) => exec_null_swap_if_many(_1, true, 1, 2)`)),
    NULLROTRIFNOT2: cat("tuple", mksimple(0x6fa7, 16, `(_1) => exec_null_swap_if_many(_1, false, 1, 2)`)),
    ADDDIVMOD: version(4, cat("div", mksimple(0xa900, 16, `exec_divmod(_1, _2, false)`))),
    ADDDIVMODR: version(4, cat("div", mksimple(0xa901, 16, `exec_divmod(_1, _2, false)`))),
    ADDDIVMODC: version(4, cat("div", mksimple(0xa902, 16, `exec_divmod(_1, _2, false)`))),
    DIV: cat("div", mksimple(0xa904, 16, `exec_divmod(_1, _2, false)`)),
    DIVR: cat("div", mksimple(0xa905, 16, `exec_divmod(_1, _2, false)`)),
    DIVC: cat("div", mksimple(0xa906, 16, `exec_divmod(_1, _2, false)`)),
    MOD: cat("div", mksimple(0xa908, 16, `exec_divmod(_1, _2, false)`)),
    MODR: cat("div", mksimple(0xa909, 16, `exec_divmod(_1, _2, false)`)),
    MODC: cat("div", mksimple(0xa90a, 16, `exec_divmod(_1, _2, false)`)),
    DIVMOD: cat("div", mksimple(0xa90c, 16, `exec_divmod(_1, _2, false)`)),
    DIVMODR: cat("div", mksimple(0xa90d, 16, `exec_divmod(_1, _2, false)`)),
    DIVMODC: cat("div", mksimple(0xa90e, 16, `exec_divmod(_1, _2, false)`)),
    QADDDIVMOD: version(4, cat("div", mksimple(0xb7a900, 24, `exec_divmod(_1, _2, true)`))),
    QADDDIVMODR: version(4, cat("div", mksimple(0xb7a901, 24, `exec_divmod(_1, _2, true)`))),
    QADDDIVMODC: version(4, cat("div", mksimple(0xb7a902, 24, `exec_divmod(_1, _2, true)`))),
    QDIV: cat("div", mksimple(0xb7a904, 24, `exec_divmod(_1, _2, true)`)),
    QDIVR: cat("div", mksimple(0xb7a905, 24, `exec_divmod(_1, _2, true)`)),
    QDIVC: cat("div", mksimple(0xb7a906, 24, `exec_divmod(_1, _2, true)`)),
    QMOD: cat("div", mksimple(0xb7a908, 24, `exec_divmod(_1, _2, true)`)),
    QMODR: cat("div", mksimple(0xb7a909, 24, `exec_divmod(_1, _2, true)`)),
    QMODC: cat("div", mksimple(0xb7a90a, 24, `exec_divmod(_1, _2, true)`)),
    QDIVMOD: cat("div", mksimple(0xb7a90c, 24, `exec_divmod(_1, _2, true)`)),
    QDIVMODR: cat("div", mksimple(0xb7a90d, 24, `exec_divmod(_1, _2, true)`)),
    QDIVMODC: cat("div", mksimple(0xb7a90e, 24, `exec_divmod(_1, _2, true)`)),
    ADDRSHIFTMOD: version(4, cat("div", cat("div", mksimple(0xa920, 16, `exec_shrmod(_1, _2, 0)`)))),
    ADDRSHIFTMODR: version(4, cat("div", cat("div", mksimple(0xa921, 16, `exec_shrmod(_1, _2, 0)`)))),
    ADDRSHIFTMODC: version(4, cat("div", cat("div", mksimple(0xa922, 16, `exec_shrmod(_1, _2, 0)`)))),
    RSHIFTR: cat("div", mksimple(0xa925, 16, `exec_shrmod(_1, _2, 0)`)),
    RSHIFTC: cat("div", mksimple(0xa926, 16, `exec_shrmod(_1, _2, 0)`)),
    MODPOW2: cat("div", mksimple(0xa928, 16, `exec_shrmod(_1, _2, 0)`)),
    MODPOW2R: cat("div", mksimple(0xa929, 16, `exec_shrmod(_1, _2, 0)`)),
    MODPOW2C: cat("div", mksimple(0xa92a, 16, `exec_shrmod(_1, _2, 0)`)),
    RSHIFTMOD: cat("div", mksimple(0xa92c, 16, `exec_shrmod(_1, _2, 0)`)),
    RSHIFTMODR: cat("div", mksimple(0xa92d, 16, `exec_shrmod(_1, _2, 0)`)),
    RSHIFTMODC: cat("div", mksimple(0xa92e, 16, `exec_shrmod(_1, _2, 0)`)),
    QADDRSHIFTMOD: version(4, cat("div", mksimple(0xb7a920, 24, `exec_shrmod(_1, _2, 1)`))),
    QADDRSHIFTMODR: version(4, cat("div", mksimple(0xb7a921, 24, `exec_shrmod(_1, _2, 1)`))),
    QADDRSHIFTMODC: version(4, cat("div", mksimple(0xb7a922, 24, `exec_shrmod(_1, _2, 1)`))),
    QRSHIFTR: cat("div", mksimple(0xb7a925, 24, `exec_shrmod(_1, _2, 1)`)),
    QRSHIFTC: cat("div", mksimple(0xb7a926, 24, `exec_shrmod(_1, _2, 1)`)),
    QMODPOW2: cat("div", mksimple(0xb7a928, 24, `exec_shrmod(_1, _2, 1)`)),
    QMODPOW2R: cat("div", mksimple(0xb7a929, 24, `exec_shrmod(_1, _2, 1)`)),
    QMODPOW2C: cat("div", mksimple(0xb7a92a, 24, `exec_shrmod(_1, _2, 1)`)),
    QRSHIFTMOD: cat("div", mksimple(0xb7a92c, 24, `exec_shrmod(_1, _2, 1)`)),
    QRSHIFTMODR: cat("div", mksimple(0xb7a92d, 24, `exec_shrmod(_1, _2, 1)`)),
    QRSHIFTMODC: cat("div", mksimple(0xb7a92e, 24, `exec_shrmod(_1, _2, 1)`)),
    MULADDDIVMOD: version(4, cat("div", mksimple(0xa980, 16, `exec_muldivmod(_1, _2, false)`))),
    MULADDDIVMODR: version(4, cat("div", mksimple(0xa981, 16, `exec_muldivmod(_1, _2, false)`))),
    MULADDDIVMODC: version(4, cat("div", mksimple(0xa982, 16, `exec_muldivmod(_1, _2, false)`))),
    MULDIV: cat("div", mksimple(0xa984, 16, `exec_muldivmod(_1, _2, false)`)),
    MULDIVR: cat("div", mksimple(0xa985, 16, `exec_muldivmod(_1, _2, false)`)),
    MULDIVC: cat("div", mksimple(0xa986, 16, `exec_muldivmod(_1, _2, false)`)),
    MULMOD: cat("div", mksimple(0xa988, 16, `exec_muldivmod(_1, _2, false)`)),
    MULMODR: cat("div", mksimple(0xa989, 16, `exec_muldivmod(_1, _2, false)`)),
    MULMODC: cat("div", mksimple(0xa98a, 16, `exec_muldivmod(_1, _2, false)`)),
    MULDIVMOD: cat("div", mksimple(0xa98c, 16, `exec_muldivmod(_1, _2, false)`)),
    MULDIVMODR: cat("div", mksimple(0xa98d, 16, `exec_muldivmod(_1, _2, false)`)),
    MULDIVMODC: cat("div", mksimple(0xa98e, 16, `exec_muldivmod(_1, _2, false)`)),
    QMULADDDIVMOD: version(4, cat("div", mksimple(0xb7a980, 24, `exec_muldivmod(_1, _2, true)`))),
    QMULADDDIVMODR: version(4, cat("div", mksimple(0xb7a981, 24, `exec_muldivmod(_1, _2, true)`))),
    QMULADDDIVMODC: version(4, cat("div", mksimple(0xb7a982, 24, `exec_muldivmod(_1, _2, true)`))),
    QMULDIV: cat("div", mksimple(0xb7a984, 24, `exec_muldivmod(_1, _2, true)`)),
    QMULDIVR: cat("div", mksimple(0xb7a985, 24, `exec_muldivmod(_1, _2, true)`)),
    QMULDIVC: cat("div", mksimple(0xb7a986, 24, `exec_muldivmod(_1, _2, true)`)),
    QMULMOD: cat("div", mksimple(0xb7a988, 24, `exec_muldivmod(_1, _2, true)`)),
    QMULMODR: cat("div", mksimple(0xb7a989, 24, `exec_muldivmod(_1, _2, true)`)),
    QMULMODC: cat("div", mksimple(0xb7a98a, 24, `exec_muldivmod(_1, _2, true)`)),
    QMULDIVMOD: cat("div", mksimple(0xb7a98c, 24, `exec_muldivmod(_1, _2, true)`)),
    QMULDIVMODR: cat("div", mksimple(0xb7a98d, 24, `exec_muldivmod(_1, _2, true)`)),
    QMULDIVMODC: cat("div", mksimple(0xb7a98e, 24, `exec_muldivmod(_1, _2, true)`)),
    MULADDRSHIFTMOD: version(4, cat("div", mksimple(0xa9a0, 16, `exec_mulshrmod(_1, _2, 0)`))),
    MULADDRSHIFTRMOD: version(4, cat("div", mksimple(0xa9a1, 16, `exec_mulshrmod(_1, _2, 0)`))),
    MULADDRSHIFTCMOD: version(4, cat("div", mksimple(0xa9a2, 16, `exec_mulshrmod(_1, _2, 0)`))),
    MULRSHIFT: cat("div", mksimple(0xa9a4, 16, `exec_mulshrmod(_1, _2, 0)`)),
    MULRSHIFTR: cat("div", mksimple(0xa9a5, 16, `exec_mulshrmod(_1, _2, 0)`)),
    MULRSHIFTC: cat("div", mksimple(0xa9a6, 16, `exec_mulshrmod(_1, _2, 0)`)),
    MULMODPOW2: cat("div", mksimple(0xa9a8, 16, `exec_mulshrmod(_1, _2, 0)`)),
    MULMODPOW2R: cat("div", mksimple(0xa9a9, 16, `exec_mulshrmod(_1, _2, 0)`)),
    MULMODPOW2C: cat("div", mksimple(0xa9aa, 16, `exec_mulshrmod(_1, _2, 0)`)),
    MULRSHIFTMOD: cat("div", mksimple(0xa9ac, 16, `exec_mulshrmod(_1, _2, 0)`)),
    MULRSHIFTRMOD: cat("div", mksimple(0xa9ad, 16, `exec_mulshrmod(_1, _2, 0)`)),
    MULRSHIFTCMOD: cat("div", mksimple(0xa9ae, 16, `exec_mulshrmod(_1, _2, 0)`)),
    QMULADDRSHIFTMOD: version(4, cat("div", mksimple(0xb7a9a0, 24, `exec_mulshrmod(_1, _2, 1)`))),
    QMULADDRSHIFTRMOD: version(4, cat("div", mksimple(0xb7a9a1, 24, `exec_mulshrmod(_1, _2, 1)`))),
    QMULADDRSHIFTCMOD: version(4, cat("div", mksimple(0xb7a9a2, 24, `exec_mulshrmod(_1, _2, 1)`))),
    QMULRSHIFT: cat("div", mksimple(0xb7a9a4, 24, `exec_mulshrmod(_1, _2, 1)`)),
    QMULRSHIFTR: cat("div", mksimple(0xb7a9a5, 24, `exec_mulshrmod(_1, _2, 1)`)),
    QMULRSHIFTC: cat("div", mksimple(0xb7a9a6, 24, `exec_mulshrmod(_1, _2, 1)`)),
    QMULMODPOW2: cat("div", mksimple(0xb7a9a8, 24, `exec_mulshrmod(_1, _2, 1)`)),
    QMULMODPOW2R: cat("div", mksimple(0xb7a9a9, 24, `exec_mulshrmod(_1, _2, 1)`)),
    QMULMODPOW2C: cat("div", mksimple(0xb7a9aa, 24, `exec_mulshrmod(_1, _2, 1)`)),
    QMULRSHIFTMOD: cat("div", mksimple(0xb7a9ac, 24, `exec_mulshrmod(_1, _2, 1)`)),
    QMULRSHIFTRMOD: cat("div", mksimple(0xb7a9ad, 24, `exec_mulshrmod(_1, _2, 1)`)),
    QMULRSHIFTCMOD: cat("div", mksimple(0xb7a9ae, 24, `exec_mulshrmod(_1, _2, 1)`)),
    LSHIFTADDDIVMOD: version(4, cat("div", mksimple(0xa9c0, 16, `exec_shldivmod(_1, _2, 0)`))),
    LSHIFTADDDIVMODR: version(4, cat("div", mksimple(0xa9c1, 16, `exec_shldivmod(_1, _2, 0)`))),
    LSHIFTADDDIVMODC: version(4, cat("div", mksimple(0xa9c2, 16, `exec_shldivmod(_1, _2, 0)`))),
    LSHIFTDIV: cat("div", mksimple(0xa9c4, 16, `exec_shldivmod(_1, _2, 0)`)),
    LSHIFTDIVR: cat("div", mksimple(0xa9c5, 16, `exec_shldivmod(_1, _2, 0)`)),
    LSHIFTDIVC: cat("div", mksimple(0xa9c6, 16, `exec_shldivmod(_1, _2, 0)`)),
    LSHIFTMOD: cat("div", mksimple(0xa9c8, 16, `exec_shldivmod(_1, _2, 0)`)),
    LSHIFTMODR: cat("div", mksimple(0xa9c9, 16, `exec_shldivmod(_1, _2, 0)`)),
    LSHIFTMODC: cat("div", mksimple(0xa9ca, 16, `exec_shldivmod(_1, _2, 0)`)),
    LSHIFTDIVMOD: cat("div", mksimple(0xa9cc, 16, `exec_shldivmod(_1, _2, 0)`)),
    LSHIFTDIVMODR: cat("div", mksimple(0xa9cd, 16, `exec_shldivmod(_1, _2, 0)`)),
    LSHIFTDIVMODC: cat("div", mksimple(0xa9ce, 16, `exec_shldivmod(_1, _2, 0)`)),
    QLSHIFTADDDIVMOD: version(4, cat("div", mksimple(0xb7a9c0, 24, `exec_shldivmod(_1, _2, 1)`))),
    QLSHIFTADDDIVMODR: version(4, cat("div", mksimple(0xb7a9c1, 24, `exec_shldivmod(_1, _2, 1)`))),
    QLSHIFTADDDIVMODC: version(4, cat("div", mksimple(0xb7a9c2, 24, `exec_shldivmod(_1, _2, 1)`))),
    QLSHIFTDIV: cat("div", mksimple(0xb7a9c4, 24, `exec_shldivmod(_1, _2, 1)`)),
    QLSHIFTDIVR: cat("div", mksimple(0xb7a9c5, 24, `exec_shldivmod(_1, _2, 1)`)),
    QLSHIFTDIVC: cat("div", mksimple(0xb7a9c6, 24, `exec_shldivmod(_1, _2, 1)`)),
    QLSHIFTMOD: cat("div", mksimple(0xb7a9c8, 24, `exec_shldivmod(_1, _2, 1)`)),
    QLSHIFTMODR: cat("div", mksimple(0xb7a9c9, 24, `exec_shldivmod(_1, _2, 1)`)),
    QLSHIFTMODC: cat("div", mksimple(0xb7a9ca, 24, `exec_shldivmod(_1, _2, 1)`)),
    QLSHIFTDIVMOD: cat("div", mksimple(0xb7a9cc, 24, `exec_shldivmod(_1, _2, 1)`)),
    QLSHIFTDIVMODR: cat("div", mksimple(0xb7a9cd, 24, `exec_shldivmod(_1, _2, 1)`)),
    QLSHIFTDIVMODC: cat("div", mksimple(0xb7a9ce, 24, `exec_shldivmod(_1, _2, 1)`)),
    STIX: cat("cell_serialize", mksimple(0xcf00, 16, `exec_store_int_var`)),
    STUX: cat("cell_serialize", mksimple(0xcf01, 16, `exec_store_int_var`)),
    STIXR: cat("cell_serialize", mksimple(0xcf02, 16, `exec_store_int_var`)),
    STUXR: cat("cell_serialize", mksimple(0xcf03, 16, `exec_store_int_var`)),
    STIXQ: cat("cell_serialize", mksimple(0xcf04, 16, `exec_store_int_var`)),
    STUXQ: cat("cell_serialize", mksimple(0xcf05, 16, `exec_store_int_var`)),
    STIXRQ: cat("cell_serialize", mksimple(0xcf06, 16, `exec_store_int_var`)),
    STUXRQ: cat("cell_serialize", mksimple(0xcf07, 16, `exec_store_int_var`)),
    STILE4: cat("cell_serialize", mksimple(0xcf28, 16, `exec_store_le_int`)),
    STULE4: cat("cell_serialize", mksimple(0xcf29, 16, `exec_store_le_int`)),
    STILE8: cat("cell_serialize", mksimple(0xcf2a, 16, `exec_store_le_int`)),
    STULE8: cat("cell_serialize", mksimple(0xcf2b, 16, `exec_store_le_int`)),
    LDIX: cat("cell_deserialize", mksimple(0xd700, 16, `exec_load_int_var`)),
    LDUX: cat("cell_deserialize", mksimple(0xd701, 16, `exec_load_int_var`)),
    PLDIX: cat("cell_deserialize", mksimple(0xd702, 16, `exec_load_int_var`)),
    PLDUX: cat("cell_deserialize", mksimple(0xd703, 16, `exec_load_int_var`)),
    LDIXQ: cat("cell_deserialize", mksimple(0xd704, 16, `exec_load_int_var`)),
    LDUXQ: cat("cell_deserialize", mksimple(0xd705, 16, `exec_load_int_var`)),
    PLDIXQ: cat("cell_deserialize", mksimple(0xd706, 16, `exec_load_int_var`)),
    PLDUXQ: cat("cell_deserialize", mksimple(0xd707, 16, `exec_load_int_var`)),
    LDSLICEX: cat("cell_deserialize", mksimple(0xd718, 16, `exec_load_slice`)),
    PLDSLICEX: cat("cell_deserialize", mksimple(0xd719, 16, `exec_load_slice`)),
    LDSLICEXQ: cat("cell_deserialize", mksimple(0xd71a, 16, `exec_load_slice`)),
    PLDSLICEXQ: cat("cell_deserialize", mksimple(0xd71b, 16, `exec_load_slice`)),
    LDILE4: cat("cell_deserialize", mksimple(0xd750, 16, `exec_load_le_int`)),
    LDULE4: cat("cell_deserialize", mksimple(0xd751, 16, `exec_load_le_int`)),
    LDILE8: cat("cell_deserialize", mksimple(0xd752, 16, `exec_load_le_int`)),
    LDULE8: cat("cell_deserialize", mksimple(0xd753, 16, `exec_load_le_int`)),
    PLDILE4: cat("cell_deserialize", mksimple(0xd754, 16, `exec_load_le_int`)),
    PLDULE4: cat("cell_deserialize", mksimple(0xd755, 16, `exec_load_le_int`)),
    PLDILE8: cat("cell_deserialize", mksimple(0xd756, 16, `exec_load_le_int`)),
    PLDULE8: cat("cell_deserialize", mksimple(0xd757, 16, `exec_load_le_int`)),
    LDILE4Q: cat("cell_deserialize", mksimple(0xd758, 16, `exec_load_le_int`)),
    LDULE4Q: cat("cell_deserialize", mksimple(0xd759, 16, `exec_load_le_int`)),
    LDILE8Q: cat("cell_deserialize", mksimple(0xd75a, 16, `exec_load_le_int`)),
    LDULE8Q: cat("cell_deserialize", mksimple(0xd75b, 16, `exec_load_le_int`)),
    PLDILE4Q: cat("cell_deserialize", mksimple(0xd75c, 16, `exec_load_le_int`)),
    PLDULE4Q: cat("cell_deserialize", mksimple(0xd75d, 16, `exec_load_le_int`)),
    PLDILE8Q: cat("cell_deserialize", mksimple(0xd75e, 16, `exec_load_le_int`)),
    PLDULE8Q: cat("cell_deserialize", mksimple(0xd75f, 16, `exec_load_le_int`)),
    DICTIGETJMP: cat("dictionary", mksimple(0xf4a0, 16, `exec_dict_get_exec`)),
    DICTUGETJMP: cat("dictionary", mksimple(0xf4a1, 16, `exec_dict_get_exec`)),
    DICTIGETEXEC: cat("dictionary", mksimple(0xf4a2, 16, `exec_dict_get_exec`)),
    DICTUGETEXEC: cat("dictionary", mksimple(0xf4a3, 16, `exec_dict_get_exec`)),
    DICTIGETJMPZ: cat("dictionary", mksimple(0xf4bc, 16, `exec_dict_get_exec`)),
    DICTUGETJMPZ: cat("dictionary", mksimple(0xf4bd, 16, `exec_dict_get_exec`)),
    DICTIGETEXECZ: cat("dictionary", mksimple(0xf4be, 16, `exec_dict_get_exec`)),
    DICTUGETEXECZ: cat("dictionary", mksimple(0xf4bf, 16, `exec_dict_get_exec`)),
    DICTGET: cat("dictionary", mksimple(0xf40a, 16, `exec_dict_get`)),
    DICTGETREF: cat("dictionary", mksimple(0xf40b, 16, `exec_dict_get`)),
    DICTIGET: cat("dictionary", mksimple(0xf40c, 16, `exec_dict_get`)),
    DICTIGETREF: cat("dictionary", mksimple(0xf40d, 16, `exec_dict_get`)),
    DICTUGET: cat("dictionary", mksimple(0xf40e, 16, `exec_dict_get`)),
    DICTUGETREF: cat("dictionary", mksimple(0xf40f, 16, `exec_dict_get`)),
    DICTSET: cat("dictionary", mksimple(0xf412, 16, `exec_dict_set(_1, _2, Set, 'SET', false)`)),
    DICTSETREF: cat("dictionary", mksimple(0xf413, 16, `exec_dict_set(_1, _2, Set, 'SET', false)`)),
    DICTISET: cat("dictionary", mksimple(0xf414, 16, `exec_dict_set(_1, _2, Set, 'SET', false)`)),
    DICTISETREF: cat("dictionary", mksimple(0xf415, 16, `exec_dict_set(_1, _2, Set, 'SET', false)`)),
    DICTUSET: cat("dictionary", mksimple(0xf416, 16, `exec_dict_set(_1, _2, Set, 'SET', false)`)),
    DICTUSETREF: cat("dictionary", mksimple(0xf417, 16, `exec_dict_set(_1, _2, Set, 'SET', false)`)),
    DICTSETGET: cat("dictionary", mksimple(0xf41a, 16, `exec_dict_setget(_1, _2, Set, 'SETGET', false)`)),
    DICTSETGETREF: cat("dictionary", mksimple(0xf41b, 16, `exec_dict_setget(_1, _2, Set, 'SETGET', false)`)),
    DICTISETGET: cat("dictionary", mksimple(0xf41c, 16, `exec_dict_setget(_1, _2, Set, 'SETGET', false)`)),
    DICTISETGETREF: cat("dictionary", mksimple(0xf41d, 16, `exec_dict_setget(_1, _2, Set, 'SETGET', false)`)),
    DICTUSETGET: cat("dictionary", mksimple(0xf41e, 16, `exec_dict_setget(_1, _2, Set, 'SETGET', false)`)),
    DICTUSETGETREF: cat("dictionary", mksimple(0xf41f, 16, `exec_dict_setget(_1, _2, Set, 'SETGET', false)`)),
    DICTREPLACE: cat("dictionary", mksimple(0xf422, 16, `exec_dict_set(_1, _2, Replace, 'REPLACE', false)`)),
    DICTREPLACEREF: cat("dictionary", mksimple(0xf423, 16, `exec_dict_set(_1, _2, Replace, 'REPLACE', false)`)),
    DICTIREPLACE: cat("dictionary", mksimple(0xf424, 16, `exec_dict_set(_1, _2, Replace, 'REPLACE', false)`)),
    DICTIREPLACEREF: cat("dictionary", mksimple(0xf425, 16, `exec_dict_set(_1, _2, Replace, 'REPLACE', false)`)),
    DICTUREPLACE: cat("dictionary", mksimple(0xf426, 16, `exec_dict_set(_1, _2, Replace, 'REPLACE', false)`)),
    DICTUREPLACEREF: cat("dictionary", mksimple(0xf427, 16, `exec_dict_set(_1, _2, Replace, 'REPLACE', false)`)),
    DICTREPLACEGET: cat("dictionary", mksimple(0xf42a, 16, `exec_dict_setget(_1, _2, Replace, 'REPLACEGET', false)`)),
    DICTREPLACEGETREF: cat("dictionary", mksimple(0xf42b, 16, `exec_dict_setget(_1, _2, Replace, 'REPLACEGET', false)`)),
    DICTIREPLACEGET: cat("dictionary", mksimple(0xf42c, 16, `exec_dict_setget(_1, _2, Replace, 'REPLACEGET', false)`)),
    DICTIREPLACEGETREF: cat("dictionary", mksimple(0xf42d, 16, `exec_dict_setget(_1, _2, Replace, 'REPLACEGET', false)`)),
    DICTUREPLACEGET: cat("dictionary", mksimple(0xf42e, 16, `exec_dict_setget(_1, _2, Replace, 'REPLACEGET', false)`)),
    DICTUREPLACEGETREF: cat("dictionary", mksimple(0xf42f, 16, `exec_dict_setget(_1, _2, Replace, 'REPLACEGET', false)`)),
    DICTADD: cat("dictionary", mksimple(0xf432, 16, `exec_dict_set(_1, _2, Add, 'ADD', false)`)),
    DICTADDREF: cat("dictionary", mksimple(0xf433, 16, `exec_dict_set(_1, _2, Add, 'ADD', false)`)),
    DICTIADD: cat("dictionary", mksimple(0xf434, 16, `exec_dict_set(_1, _2, Add, 'ADD', false)`)),
    DICTIADDREF: cat("dictionary", mksimple(0xf435, 16, `exec_dict_set(_1, _2, Add, 'ADD', false)`)),
    DICTUADD: cat("dictionary", mksimple(0xf436, 16, `exec_dict_set(_1, _2, Add, 'ADD', false)`)),
    DICTUADDREF: cat("dictionary", mksimple(0xf437, 16, `exec_dict_set(_1, _2, Add, 'ADD', false)`)),
    DICTADDGET: cat("dictionary", mksimple(0xf43a, 16, `exec_dict_setget(_1, _2, Add, 'ADDGET', false)`)),
    DICTADDGETREF: cat("dictionary", mksimple(0xf43b, 16, `exec_dict_setget(_1, _2, Add, 'ADDGET', false)`)),
    DICTIADDGET: cat("dictionary", mksimple(0xf43c, 16, `exec_dict_setget(_1, _2, Add, 'ADDGET', false)`)),
    DICTIADDGETREF: cat("dictionary", mksimple(0xf43d, 16, `exec_dict_setget(_1, _2, Add, 'ADDGET', false)`)),
    DICTUADDGET: cat("dictionary", mksimple(0xf43e, 16, `exec_dict_setget(_1, _2, Add, 'ADDGET', false)`)),
    DICTUADDGETREF: cat("dictionary", mksimple(0xf43f, 16, `exec_dict_setget(_1, _2, Add, 'ADDGET', false)`)),
    DICTDELGET: cat("dictionary", mksimple(0xf462, 16, `exec_dict_deleteget`)),
    DICTDELGETREF: cat("dictionary", mksimple(0xf463, 16, `exec_dict_deleteget`)),
    DICTIDELGET: cat("dictionary", mksimple(0xf464, 16, `exec_dict_deleteget`)),
    DICTIDELGETREF: cat("dictionary", mksimple(0xf465, 16, `exec_dict_deleteget`)),
    DICTUDELGET: cat("dictionary", mksimple(0xf466, 16, `exec_dict_deleteget`)),
    DICTUDELGETREF: cat("dictionary", mksimple(0xf467, 16, `exec_dict_deleteget`)),
    DICTMIN: cat("dictionary", mksimple(0xf482, 16, `exec_dict_getmin`)),
    DICTMINREF: cat("dictionary", mksimple(0xf483, 16, `exec_dict_getmin`)),
    DICTIMIN: cat("dictionary", mksimple(0xf484, 16, `exec_dict_getmin`)),
    DICTIMINREF: cat("dictionary", mksimple(0xf485, 16, `exec_dict_getmin`)),
    DICTUMIN: cat("dictionary", mksimple(0xf486, 16, `exec_dict_getmin`)),
    DICTUMINREF: cat("dictionary", mksimple(0xf487, 16, `exec_dict_getmin`)),
    DICTMAX: cat("dictionary", mksimple(0xf48a, 16, `exec_dict_getmin`)),
    DICTMAXREF: cat("dictionary", mksimple(0xf48b, 16, `exec_dict_getmin`)),
    DICTIMAX: cat("dictionary", mksimple(0xf48c, 16, `exec_dict_getmin`)),
    DICTIMAXREF: cat("dictionary", mksimple(0xf48d, 16, `exec_dict_getmin`)),
    DICTUMAX: cat("dictionary", mksimple(0xf48e, 16, `exec_dict_getmin`)),
    DICTUMAXREF: cat("dictionary", mksimple(0xf48f, 16, `exec_dict_getmin`)),
    DICTREMMIN: cat("dictionary", mksimple(0xf492, 16, `exec_dict_getmin`)),
    DICTREMMINREF: cat("dictionary", mksimple(0xf493, 16, `exec_dict_getmin`)),
    DICTIREMMIN: cat("dictionary", mksimple(0xf494, 16, `exec_dict_getmin`)),
    DICTIREMMINREF: cat("dictionary", mksimple(0xf495, 16, `exec_dict_getmin`)),
    DICTUREMMIN: cat("dictionary", mksimple(0xf496, 16, `exec_dict_getmin`)),
    DICTUREMMINREF: cat("dictionary", mksimple(0xf497, 16, `exec_dict_getmin`)),
    DICTREMMAX: cat("dictionary", mksimple(0xf49a, 16, `exec_dict_getmin`)),
    DICTREMMAXREF: cat("dictionary", mksimple(0xf49b, 16, `exec_dict_getmin`)),
    DICTIREMMAX: cat("dictionary", mksimple(0xf49c, 16, `exec_dict_getmin`)),
    DICTIREMMAXREF: cat("dictionary", mksimple(0xf49d, 16, `exec_dict_getmin`)),
    DICTUREMMAX: cat("dictionary", mksimple(0xf49e, 16, `exec_dict_getmin`)),
    DICTUREMMAXREF: cat("dictionary", mksimple(0xf49f, 16, `exec_dict_getmin`)),
    DICTSETB: cat("dictionary", mksimple(0xf441, 16, `exec_dict_set(_1, _2, Set, 'SET', true)`)),
    DICTISETB: cat("dictionary", mksimple(0xf442, 16, `exec_dict_set(_1, _2, Set, 'SET', true)`)),
    DICTUSETB: cat("dictionary", mksimple(0xf443, 16, `exec_dict_set(_1, _2, Set, 'SET', true)`)),
    DICTSETGETB: cat("dictionary", mksimple(0xf445, 16, `exec_dict_setget(_1, _2, Set, 'SETGET', true)`)),
    DICTISETGETB: cat("dictionary", mksimple(0xf446, 16, `exec_dict_setget(_1, _2, Set, 'SETGET', true)`)),
    DICTUSETGETB: cat("dictionary", mksimple(0xf447, 16, `exec_dict_setget(_1, _2, Set, 'SETGET', true)`)),
    DICTREPLACEB: cat("dictionary", mksimple(0xf449, 16, `exec_dict_set(_1, _2, Replace, 'REPLACE', true)`)),
    DICTIREPLACEB: cat("dictionary", mksimple(0xf44a, 16, `exec_dict_set(_1, _2, Replace, 'REPLACE', true)`)),
    DICTUREPLACEB: cat("dictionary", mksimple(0xf44b, 16, `exec_dict_set(_1, _2, Replace, 'REPLACE', true)`)),
    DICTREPLACEGETB: cat("dictionary", mksimple(0xf44d, 16, `exec_dict_setget(_1, _2, Replace, 'REPLACEGET', true)`)),
    DICTIREPLACEGETB: cat("dictionary", mksimple(0xf44e, 16, `exec_dict_setget(_1, _2, Replace, 'REPLACEGET', true)`)),
    DICTUREPLACEGETB: cat("dictionary", mksimple(0xf44f, 16, `exec_dict_setget(_1, _2, Replace, 'REPLACEGET', true)`)),
    DICTADDB: cat("dictionary", mksimple(0xf451, 16, `exec_dict_set(_1, _2, Add, 'ADD', true)`)),
    DICTIADDB: cat("dictionary", mksimple(0xf452, 16, `exec_dict_set(_1, _2, Add, 'ADD', true)`)),
    DICTUADDB: cat("dictionary", mksimple(0xf453, 16, `exec_dict_set(_1, _2, Add, 'ADD', true)`)),
    DICTADDGETB: cat("dictionary", mksimple(0xf455, 16, `exec_dict_setget(_1, _2, Add, 'ADDGET', true)`)),
    DICTIADDGETB: cat("dictionary", mksimple(0xf456, 16, `exec_dict_setget(_1, _2, Add, 'ADDGET', true)`)),
    DICTUADDGETB: cat("dictionary", mksimple(0xf457, 16, `exec_dict_setget(_1, _2, Add, 'ADDGET', true)`)),
    DICTDEL: cat("dictionary", mksimple(0xf459, 16, `exec_dict_delete`)),
    DICTIDEL: cat("dictionary", mksimple(0xf45a, 16, `exec_dict_delete`)),
    DICTUDEL: cat("dictionary", mksimple(0xf45b, 16, `exec_dict_delete`)),
    DICTGETOPTREF: cat("dictionary", mksimple(0xf469, 16, `exec_dict_get_optref`)),
    DICTIGETOPTREF: cat("dictionary", mksimple(0xf46a, 16, `exec_dict_get_optref`)),
    DICTUGETOPTREF: cat("dictionary", mksimple(0xf46b, 16, `exec_dict_get_optref`)),
    DICTSETGETOPTREF: cat("dictionary", mksimple(0xf46d, 16, `exec_dict_setget_optref`)),
    DICTISETGETOPTREF: cat("dictionary", mksimple(0xf46e, 16, `exec_dict_setget_optref`)),
    DICTUSETGETOPTREF: cat("dictionary", mksimple(0xf46f, 16, `exec_dict_setget_optref`)),
    SUBDICTGET: cat("dictionary", mksimple(0xf4b1, 16, `exec_subdict_get`)),
    SUBDICTIGET: cat("dictionary", mksimple(0xf4b2, 16, `exec_subdict_get`)),
    SUBDICTUGET: cat("dictionary", mksimple(0xf4b3, 16, `exec_subdict_get`)),
    SUBDICTRPGET: cat("dictionary", mksimple(0xf4b5, 16, `exec_subdict_get`)),
    SUBDICTIRPGET: cat("dictionary", mksimple(0xf4b6, 16, `exec_subdict_get`)),
    SUBDICTURPGET: cat("dictionary", mksimple(0xf4b7, 16, `exec_subdict_get`)),
    THROWANY: effects(cat("exception", mksimple(0xf2f0, 16, `exec_throw_any`)), AlwaysThrow()),
    THROWARGANY: effects(cat("exception", mksimple(0xf2f1, 16, `exec_throw_any`)), AlwaysThrow()),
    THROWANYIFNOT: effects(cat("exception", mksimple(0xf2f4, 16, `exec_throw_any`)), CanThrow()),
    THROWARGANYIFNOT: effects(cat("exception", mksimple(0xf2f5, 16, `exec_throw_any`)), CanThrow()),
    DICTGETNEXT: cat("dictionary", mksimple(0xf474, 16, `exec_dict_getnear`)),
    DICTGETNEXTEQ: cat("dictionary", mksimple(0xf475, 16, `exec_dict_getnear`)),
    DICTGETPREV: cat("dictionary", mksimple(0xf476, 16, `exec_dict_getnear`)),
    DICTGETPREVEQ: cat("dictionary", mksimple(0xf477, 16, `exec_dict_getnear`)),
    DICTIGETNEXT: cat("dictionary", mksimple(0xf478, 16, `exec_dict_getnear`)),
    DICTIGETNEXTEQ: cat("dictionary", mksimple(0xf479, 16, `exec_dict_getnear`)),
    DICTIGETPREV: cat("dictionary", mksimple(0xf47a, 16, `exec_dict_getnear`)),
    DICTIGETPREVEQ: cat("dictionary", mksimple(0xf47b, 16, `exec_dict_getnear`)),
    DICTUGETNEXT: cat("dictionary", mksimple(0xf47c, 16, `exec_dict_getnear`)),
    DICTUGETNEXTEQ: cat("dictionary", mksimple(0xf47d, 16, `exec_dict_getnear`)),
    DICTUGETPREV: cat("dictionary", mksimple(0xf47e, 16, `exec_dict_getnear`)),
    DICTUGETPREVEQ: cat("dictionary", mksimple(0xf47f, 16, `exec_dict_getnear`)),

    ADDINT: cat("add_mul", mkfixedn(0xa6, 8, 8, seq(int8), `exec_add_tinyint8(_1, _2, false)`)),
    MULINT: cat("add_mul", mkfixedn(0xa7, 8, 8, seq(int8), `exec_mul_tinyint8(_1, _2, false)`)),
    QADDINT: cat("add_mul", mkfixedn(0xb7a6, 16, 8, seq(int8), `exec_add_tinyint8(_1, _2, true)`)),
    QMULINT: cat("add_mul", mkfixedn(0xb7a7, 16, 8, seq(int8), `exec_mul_tinyint8(_1, _2, true)`)),
    EQINT: cat("int_cmp", mkfixedn(0xc0, 8, 8, seq(int8), `exec_cmp_int(_1, _2, 0x878, false, 'EQ')`)),
    LESSINT: cat("int_cmp", mkfixedn(0xc1, 8, 8, seq(int8), `exec_cmp_int(_1, _2, 0x887, false, 'LESS')`)),
    GTINT: cat("int_cmp", mkfixedn(0xc2, 8, 8, seq(int8), `exec_cmp_int(_1, _2, 0x788, false, 'GT')`)),
    NEQINT: cat("int_cmp", mkfixedn(0xc3, 8, 8, seq(int8), `exec_cmp_int(_1, _2, 0x787, false, 'NEQ')`)),
    QEQINT: cat("int_cmp", mkfixedn(0xb7c0, 16, 8, seq(int8), `exec_cmp_int(_1, _2, 0x878, true, 'QEQ')`)),
    QLESSINT: cat("int_cmp", mkfixedn(0xb7c1, 16, 8, seq(int8), `exec_cmp_int(_1, _2, 0x887, true, 'QLESS')`)),
    QGTINT: cat("int_cmp", mkfixedn(0xb7c2, 16, 8, seq(int8), `exec_cmp_int(_1, _2, 0x788, true, 'QGT')`)),
    QNEQINT: cat("int_cmp", mkfixedn(0xb7c3, 16, 8, seq(int8), `exec_cmp_int(_1, _2, 0x787, true, 'QNEQ')`)),
    PUSHPOW2DEC: cat("int_const", mkfixedn(0x84, 8, 8, seq(delta(1, uint8)), `exec_push_pow2dec`)),
    PUSHNEGPOW2: cat("int_const", mkfixedn(0x85, 8, 8, seq(delta(1, uint8)), `exec_push_negpow2`)),
    FITS: effects(cat("shift_logic", mkfixedn(0xb4, 8, 8, seq(delta(1, uint8)), `exec_fits_tinyint8(_1, _2, false)`)), CanThrow()),
    UFITS: effects(cat("shift_logic", mkfixedn(0xb5, 8, 8, seq(delta(1, uint8)), `exec_ufits_tinyint8(_1, _2, false)`)), CanThrow()),
    QFITS: cat("shift_logic", mkfixedn(0xb7b4, 16, 8, seq(delta(1, uint8)), `exec_fits_tinyint8(_1, _2, true)`)),
    QUFITS: cat("shift_logic", mkfixedn(0xb7b5, 16, 8, seq(delta(1, uint8)), `exec_ufits_tinyint8(_1, _2, true)`)),
    SETCONTCTRMANY: version(9, cat("continuation_change", mkfixedn(0xede3, 16, 8, seq(delta(1, uint8)), `exec_setcont_ctr_many`))),
    CALLCCARGS: cat("continuation_jump", mkfixedn(0xdb36, 16, 8, seq(uint4, uint4), `exec_callcc_args`)),
    TRYARGS: cat("exception", mkfixedn(0xf3, 8, 8, seq(uint4, uint4), `exec_try`)),
    PLDREFIDX: cat("cell_deserialize", mkfixedn(0xd74c >> 2, 14, 2, seq(uint2), `exec_preload_ref_fixed`)),
    CHASHI: version(6, cat("cell_deserialize", mkfixedn(0xd768 >> 2, 14, 2, seq(uint2), `exec_cell_hash_i(_1, _2, false)`))),
    CDEPTHI: version(6, cat("cell_deserialize", mkfixedn(0xd76c >> 2, 14, 2, seq(uint2), `exec_cell_depth_i(_1, _2, false)`))),
    JMPDICT: cat("continuation_dict_jump", mkfixedn(0xf14 >> 2, 10, 14, seq(uint14), `exec_jmpdict`)),
    PREPAREDICT: cat("continuation_dict_jump", mkfixedn(0xf18 >> 2, 10, 14, seq(uint14), `exec_preparedict`)),
    THROWARG: effects(cat("exception", mkfixedn(0xf2c8 >> 3, 13, 11, seq(uint11), `exec_throw_arg_fixed(_1, _2, 0x7ff, 0)`)), CanThrow()),
    THROWARGIF: effects(cat("exception", mkfixedn(0xf2d8 >> 3, 13, 11, seq(uint11), `exec_throw_arg_fixed(_1, _2, 0x7ff, 3)`)), CanThrow()),
    THROWARGIFNOT: effects(cat("exception", mkfixedn(0xf2e8 >> 3, 13, 11, seq(uint11), `exec_throw_arg_fixed(_1, _2, 0x7ff, 2)`)), CanThrow()),

    JMPXARGS: cat("continuation_jump", mkfixedn(0xdb1, 12, 4, seq(uint4), `exec_jmpx_args`)),
    RETARGS: cat("continuation_jump", mkfixedn(0xdb2, 12, 4, seq(uint4), `exec_ret_args`)),
    RETURNARGS: cat("continuation_change", mkfixedn(0xed0, 12, 4, seq(uint4), `exec_return_args`)),
    BLKDROP: cat("stack", mkfixedn(0x5f0, 12, 4, seq(uint4), `exec_blkdrop`)),
    TUPLE: effects(cat("tuple", mkfixedn(0x6f0, 12, 4, seq(uint4), `exec_mktuple`)), Tuple()),
    INDEX: cat("tuple", mkfixedn(0x6f1, 12, 4, seq(uint4), `exec_tuple_index`)),
    UNTUPLE: effects(cat("tuple", mkfixedn(0x6f2, 12, 4, seq(uint4), `exec_untuple`)), Tuple()),
    UNPACKFIRST: effects(cat("tuple", mkfixedn(0x6f3, 12, 4, seq(uint4), `exec_untuple_first`)), Tuple()),
    EXPLODE: effects(cat("tuple", mkfixedn(0x6f4, 12, 4, seq(uint4), `exec_explode_tuple`)), Tuple()),
    SETINDEX: cat("tuple", mkfixedn(0x6f5, 12, 4, seq(uint4), `exec_tuple_set_index`)),
    INDEXQ: cat("tuple", mkfixedn(0x6f6, 12, 4, seq(uint4), `exec_tuple_quiet_index`)),
    SETINDEXQ: cat("tuple", mkfixedn(0x6f7, 12, 4, seq(uint4), `exec_tuple_quiet_set_index`)),
    XC2PU: cat("stack", mkfixedn(0x541, 12, 12, seq(stack(4), stack(4), stack(4)), `exec_xc2pu`)),
    XCPU2: cat("stack", mkfixedn(0x543, 12, 12, seq(stack(4), stack(4), stack(4)), `exec_xcpu2`)),
    PUSH3: cat("stack", mkfixedn(0x547, 12, 12, seq(stack(4), stack(4), stack(4)), `exec_push3`)),
    XCHG2: cat("stack", mkfixedn(0x50, 8, 8, seq(stack(4), stack(4)), `exec_xchg2`)),
    XCPU: cat("stack", mkfixedn(0x51, 8, 8, seq(stack(4), stack(4)), `exec_xcpu`)),
    PUSH2: cat("stack", mkfixedn(0x53, 8, 8, seq(stack(4), stack(4)), `exec_push2`)),
    PUXC: cat("stack", mkfixedn(0x52, 8, 8, seq(stack(4), delta(-1, stack(4))), `exec_puxc`)),
    XCPUXC: cat("stack", mkfixedn(0x542, 12, 12, seq(stack(4), stack(4), delta(-1, stack(4))), `exec_xcpuxc`)),
    PUXC2: cat("stack", mkfixedn(0x544, 12, 12, seq(stack(4), delta(-1, stack(4)), delta(-1, stack(4))), `exec_puxc2`)),
    PUXCPU: cat("stack", mkfixedn(0x545, 12, 12, seq(stack(4), delta(-1, stack(4)), delta(-1, stack(4))), `exec_puxcpu`)),
    PU2XC: cat("stack", mkfixedn(0x546, 12, 12, seq(stack(4), delta(-1, stack(4)), delta(-2, stack(4))), `exec_pu2xc`)),
    BLKSWAP: cat("stack", mkfixedn(0x55, 8, 8, seq(delta(1, uint4), delta(1, uint4)), `exec_blkswap`)),
    REVERSE: cat("stack", mkfixedn(0x5e, 8, 8, seq(delta(2, uint4), uint4), `exec_reverse`)),
    SETCONTARGS: cat("continuation_change", mkfixedn(0xec, 8, 8, seq(uint4, delta(-1, uint4)), `exec_setcontargs`)),
    BLESSARGS: cat("continuation_change", mkfixedn(0xee, 8, 8, seq(uint4, delta(-1, uint4)), `exec_bless_args`)),
    STIR: cat("cell_serialize", mkfixedn(0xcf0a, 16, 8, seq(delta(1, uint8)), `exec_store_int_fixed`)),
    STUR: cat("cell_serialize", mkfixedn(0xcf0b, 16, 8, seq(delta(1, uint8)), `exec_store_int_fixed`)),
    STIQ: cat("cell_serialize", mkfixedn(0xcf0c, 16, 8, seq(delta(1, uint8)), `exec_store_int_fixed`)),
    STUQ: cat("cell_serialize", mkfixedn(0xcf0d, 16, 8, seq(delta(1, uint8)), `exec_store_int_fixed`)),
    STIRQ: cat("cell_serialize", mkfixedn(0xcf0e, 16, 8, seq(delta(1, uint8)), `exec_store_int_fixed`)),
    STURQ: cat("cell_serialize", mkfixedn(0xcf0f, 16, 8, seq(delta(1, uint8)), `exec_store_int_fixed`)),
    PLDI: cat("cell_deserialize", mkfixedn(0xd70a, 16, 8, seq(delta(1, uint8)), `exec_load_int_fixed2`)),
    PLDU: cat("cell_deserialize", mkfixedn(0xd70b, 16, 8, seq(delta(1, uint8)), `exec_load_int_fixed2`)),
    LDIQ: cat("cell_deserialize", mkfixedn(0xd70c, 16, 8, seq(delta(1, uint8)), `exec_load_int_fixed2`)),
    LDUQ: cat("cell_deserialize", mkfixedn(0xd70d, 16, 8, seq(delta(1, uint8)), `exec_load_int_fixed2`)),
    PLDIQ: cat("cell_deserialize", mkfixedn(0xd70e, 16, 8, seq(delta(1, uint8)), `exec_load_int_fixed2`)),
    PLDUQ: cat("cell_deserialize", mkfixedn(0xd70f, 16, 8, seq(delta(1, uint8)), `exec_load_int_fixed2`)),

    PLDUZ: cat("cell_deserialize", mkfixedn(0xd710 >> 3, 13, 3, seq(plduzArg), `exec_preload_uint_fixed_0e`)),
    PLDSLICE: cat("cell_deserialize", mkfixedn(0xd71d, 16, 8, seq(delta(1, uint8)), `exec_load_slice_fixed2`)),
    LDSLICEQ: cat("cell_deserialize", mkfixedn(0xd71e, 16, 8, seq(delta(1, uint8)), `exec_load_slice_fixed2`)),
    PLDSLICEQ: cat("cell_deserialize", mkfixedn(0xd71f, 16, 8, seq(delta(1, uint8)), `exec_load_slice_fixed2`)),
    IFBITJMP: cat("continuation_cond_loop", mkfixedn(0xe380 >> 5, 11, 5, seq(uint5), `exec_if_bit_jmp`)),
    IFNBITJMP: cat("continuation_cond_loop", mkfixedn(0xe3a0 >> 5, 11, 5, seq(uint5), `exec_if_bit_jmp`)),
    INDEX2: cat("tuple", mkfixedn(0x6fb, 12, 4, seq(uint2, uint2), `exec_tuple_index2`)),
    INDEX3: cat("tuple", mkfixedn(0x6fc >> 2, 10, 6, seq(uint2, uint2, uint2), `exec_tuple_index3`)),

    PUSHPOW2: cat("int_const", mkfixedrangen(0x8300, 0x83ff, 16, 8, seq(delta(1, uint8)), `exec_push_pow2`)),
    BLKPUSH: cat("stack", mkfixedrangen(0x5f10, 0x6000, 16, 8, seq(uint4, uint4), `exec_blkpush`)),
    BLKDROP2: cat("stack", mkfixedrangen(0x6c10, 0x6d00, 16, 8, seq(uint4, uint4), `exec_blkdrop2`)),
    GETGLOB: cat("config", mkfixedrangen(0xf841, 0xf860, 16, 5, seq(uint5), `exec_get_global`)),
    SETGLOB: cat("config", mkfixedrangen(0xf861, 0xf880, 16, 5, seq(uint5), `exec_set_global`)),
    GETPARAM: cat("config", mkfixedrangen(0xf820, 0xf823, 16, 4, seq(uint4), `exec_get_var_param`)),

    // SECTION: Ref instructions
    PUSHREF: cat("cell_const", mkext(0x88, 8, 0, seq(refCodeSlice), `(_1, _2, _3, _4) => exec_push_ref(_1, _2, 0, _4)`)),
    PUSHREFSLICE: effects(cat("cell_const", mkext(0x89, 8, 0, seq(refCodeSlice), `(_1, _2, _3, _4) => exec_push_ref(_1, _2, 1, _4)`)), CellLoad()),
    PUSHREFCONT: effects(cat("cell_const", mkext(0x8a, 8, 0, seq(refCodeSlice), `(_1, _2, _3, _4) => exec_push_ref(_1, _2, 2, _4)`)), CellLoad()),
    CALLREF: effects(cat("continuation_jump", mkext(0xdb3c, 16, 0, seq(refCodeSlice), `(_1, _2, _3, _4) => exec_do_with_ref(_1, _2, _4, (st, cont) => st.call((cont)), 'CALLREF')`)), CellLoad()),
    JMPREF: effects(cat("continuation_jump", mkext(0xdb3d, 16, 0, seq(refCodeSlice), `(_1, _2, _3, _4) => exec_do_with_ref(_1, _2, _4, (st, cont) => st.jump((cont)), 'JMPREF')`)), CellLoad()),
    JMPREFDATA: effects(cat("continuation_jump", mkext(0xdb3e, 16, 0, seq(refCodeSlice), `(_1, _2, _3, _4) => exec_do_with_ref(_1, _2, _4, (st, cont) => { st.push_code(); return st.jump((cont)) }, 'JMPREFDATA')`)), CellLoad()),
    IFREF: effects(cat("continuation_cond_loop", mkext(0xe300, 16, 0, seq(refCodeSlice), `(_1, _2, _3, _4) => exec_do_with_cell(1, _2, _4, (st, cell) => st.get_stack().pop_bool() ? st.call(st.ref_to_cont((cell))) : 0, 'IFREF')`)), ImplicitJumpRef(), CellLoad()),
    IFNOTREF: effects(cat("continuation_cond_loop", mkext(0xe301, 16, 0, seq(refCodeSlice), `(_1, _2, _3, _4) => exec_do_with_cell(1, _2, _4, (st, cell) => st.get_stack().pop_bool() ? 0 : st.call(st.ref_to_cont((cell))), 'IFNOTREF')`)), ImplicitJumpRef(), CellLoad()),
    IFJMPREF: effects(cat("continuation_cond_loop", mkext(0xe302, 16, 0, seq(refCodeSlice), `(_1, _2, _3, _4) => exec_do_with_cell(1, _2, _4, (st, cell) => st.get_stack().pop_bool() ? st.jump(st.ref_to_cont((cell))) : 0, 'IFJMPREF')`)), ImplicitJumpRef(), CellLoad()),
    IFNOTJMPREF: effects(cat("continuation_cond_loop", mkext(0xe303, 16, 0, seq(refCodeSlice), `(_1, _2, _3, _4) => exec_do_with_cell(1, _2, _4, (st, cell) => st.get_stack().pop_bool() ? 0 : st.jump(st.ref_to_cont((cell))), 'IFNOTJMPREF')`)), ImplicitJumpRef(), CellLoad()),
    IFREFELSE: effects(cat("continuation_cond_loop", mkext(0xe30d, 16, 0, seq(refCodeSlice), `(_1, _2, _3, _4) => exec_ifelse_ref(_1, _2, _4, true)`)), ImplicitJumpRef(), CellLoad()),
    IFELSEREF: effects(cat("continuation_cond_loop", mkext(0xe30e, 16, 0, seq(refCodeSlice), `(_1, _2, _3, _4) => exec_ifelse_ref(_1, _2, _4, false)`)), ImplicitJumpRef(), CellLoad()),
    IFREFELSEREF: effects(cat("continuation_cond_loop", mkext(0xe30f, 16, 0, seq(refCodeSlice, refCodeSlice), `exec_ifref_elseref`)), CellLoad()),

    IFBITJMPREF: effects(cat("continuation_cond_loop", mkext(0xe3c >> 1, 11, 5, seq(uint5, refCodeSlice), `exec_if_bit_jmpref`)), ImplicitJumpRef(), CellLoad()),
    IFNBITJMPREF: effects(cat("continuation_cond_loop", mkext((0xe3c >> 1) | 0b1, 11, 5, seq(uint5, refCodeSlice), `exec_if_bit_jmpref`)), ImplicitJumpRef(), CellLoad()),
    // END SECTION

    DICTPUSHCONST: cat("dictionary", mkfixedn(0x3d29, 14, 10, dictpush, `exec_push_const_dict`)),
    PFXDICTSWITCH: cat("dictionary", mkfixedn(0xf4ac00 >> 10, 14, 10, dictpush, `exec_const_pfx_dict_switch`)),

    // SECTION: sdbegins
    SDBEGINSX: cat("cell_deserialize", mksimple(0xd726, 16, `(_1) => exec_slice_begins_with(_1, false)`)),
    SDBEGINSXQ: cat("cell_deserialize", mksimple(0xd727, 16, `(_1) => exec_slice_begins_with(_1, true)`)),
    SDBEGINS: cat("cell_deserialize", mkext(0xd728 >> 2, 14, 7, seq(slice(refs(0), uint7, 3)), `exec_slice_begins_with_const`)),
    SDBEGINSQ: cat("cell_deserialize", mkext(0xd72c >> 2, 14, 7, seq(slice(refs(0), uint7, 3)), `exec_slice_begins_with_const`)),
    // END SECTION

    STREFCONST: cat("cell_serialize", mkextrange(0xcf20, 0xcf21, 16, 0, seq(refCodeSlice), `exec_store_const_ref`)),
    STREF2CONST: cat("cell_serialize", mkextrange(0xcf21, 0xcf22, 16, 0, seq(refCodeSlice, refCodeSlice), `exec_store_const_ref`)),

    THROWANYIF: effects(cat("exception", mksimple(0xf2f2, 16, `exec_throw_any`)), CanThrow()),
    THROWARGANYIF: effects(cat("exception", mksimple(0xf2f3, 16, `exec_throw_any`)), CanThrow()),
    DEBUGSTR: cat("debug", mkext(0xfef, 12, 4, seq(debugstr), `exec_dummy_debug_str`)),

    SETCONTCTR: cat("continuation_change", mkfixedrangen(0xed60, 0xed68, 16, 4, seq(control), `exec_setcont_ctr`)),
    SETRETCTR: cat("continuation_change", mkfixedrangen(0xed70, 0xed78, 16, 4, seq(control), `exec_setret_ctr`)),
    SETALTCTR: cat("continuation_change", mkfixedrangen(0xed80, 0xed88, 16, 4, seq(control), `exec_setalt_ctr`)),
    POPSAVE: cat("continuation_change", mkfixedrangen(0xed90, 0xed98, 16, 4, seq(control), `exec_popsave_ctr`)),
    SAVECTR: cat("continuation_change", mkfixedrangen(0xeda0, 0xeda8, 16, 4, seq(control), `exec_save_ctr`)),
    SAVEALTCTR: cat("continuation_change", mkfixedrangen(0xedb0, 0xedb8, 16, 4, seq(control), `exec_savealt_ctr`)),
    SAVEBOTHCTR: cat("continuation_change", mkfixedrangen(0xedc0, 0xedc8, 16, 4, seq(control), `exec_saveboth_ctr`)),

    RUNVM: version(4, cat("continuation_jump", mkfixedn(0xdb4, 12, 12, seq(runvmArg), `exec_runvm`))),

    // special case: numeric
    "2SWAP": cat("stack", mksimple(0x5a, 8, `exec_2swap`)),
    "2DROP": cat("stack", mksimple(0x5b, 8, `exec_2drop`)),
    "2DUP": cat("stack", mksimple(0x5c, 8, `exec_2dup`)),
    "2OVER": cat("stack", mksimple(0x5d, 8, `exec_2over`)),

    // special case: # opcodes
    "ADDRSHIFT#MOD": version(4, cat("div", mkfixedn(0xa930, 16, 8, seq(delta(1, uint8)), `exec_shrmod(_1, _2, 2)`))),
    "ADDRSHIFTR#MOD": version(4, cat("div", mkfixedn(0xa931, 16, 8, seq(delta(1, uint8)), `exec_shrmod(_1, _2, 2)`))),
    "ADDRSHIFTC#MOD": version(4, cat("div", mkfixedn(0xa932, 16, 8, seq(delta(1, uint8)), `exec_shrmod(_1, _2, 2)`))),
    "RSHIFT#": cat("div", mkfixedn(0xa934, 16, 8, seq(delta(1, uint8)), `exec_shrmod(_1, _2, 2)`)),
    "RSHIFTR#": cat("div", mkfixedn(0xa935, 16, 8, seq(delta(1, uint8)), `exec_shrmod(_1, _2, 2)`)),
    "RSHIFTC#": cat("div", mkfixedn(0xa936, 16, 8, seq(delta(1, uint8)), `exec_shrmod(_1, _2, 2)`)),
    "MODPOW2#": cat("div", mkfixedn(0xa938, 16, 8, seq(delta(1, uint8)), `exec_shrmod(_1, _2, 2)`)),
    "MODPOW2R#": cat("div", mkfixedn(0xa939, 16, 8, seq(delta(1, uint8)), `exec_shrmod(_1, _2, 2)`)),
    "MODPOW2C#": cat("div", mkfixedn(0xa93a, 16, 8, seq(delta(1, uint8)), `exec_shrmod(_1, _2, 2)`)),
    "RSHIFT#MOD": cat("div", mkfixedn(0xa93c, 16, 8, seq(delta(1, uint8)), `exec_shrmod(_1, _2, 2)`)),
    "RSHIFTR#MOD": cat("div", mkfixedn(0xa93d, 16, 8, seq(delta(1, uint8)), `exec_shrmod(_1, _2, 2)`)),
    "RSHIFTC#MOD": cat("div", mkfixedn(0xa93e, 16, 8, seq(delta(1, uint8)), `exec_shrmod(_1, _2, 2)`)),
    "MULADDRSHIFT#MOD": version(4, cat("div", mkfixedn(0xa9b0, 16, 8, seq(delta(1, uint8)), `exec_mulshrmod(_1, _2, 2)`))),
    "MULADDRSHIFTR#MOD": version(4, cat("div", mkfixedn(0xa9b1, 16, 8, seq(delta(1, uint8)), `exec_mulshrmod(_1, _2, 2)`))),
    "MULADDRSHIFTC#MOD": version(4, cat("div", mkfixedn(0xa9b2, 16, 8, seq(delta(1, uint8)), `exec_mulshrmod(_1, _2, 2)`))),
    "MULRSHIFT#": cat("div", mkfixedn(0xa9b4, 16, 8, seq(delta(1, uint8)), `exec_mulshrmod(_1, _2, 2)`)),
    "MULRSHIFTR#": cat("div", mkfixedn(0xa9b5, 16, 8, seq(delta(1, uint8)), `exec_mulshrmod(_1, _2, 2)`)),
    "MULRSHIFTC#": cat("div", mkfixedn(0xa9b6, 16, 8, seq(delta(1, uint8)), `exec_mulshrmod(_1, _2, 2)`)),
    "MULMODPOW2#": cat("div", mkfixedn(0xa9b8, 16, 8, seq(delta(1, uint8)), `exec_mulshrmod(_1, _2, 2)`)),
    "MULMODPOW2R#": cat("div", mkfixedn(0xa9b9, 16, 8, seq(delta(1, uint8)), `exec_mulshrmod(_1, _2, 2)`)),
    "MULMODPOW2C#": cat("div", mkfixedn(0xa9ba, 16, 8, seq(delta(1, uint8)), `exec_mulshrmod(_1, _2, 2)`)),
    "MULRSHIFT#MOD": cat("div", mkfixedn(0xa9bc, 16, 8, seq(delta(1, uint8)), `exec_mulshrmod(_1, _2, 2)`)),
    "MULRSHIFTR#MOD": cat("div", mkfixedn(0xa9bd, 16, 8, seq(delta(1, uint8)), `exec_mulshrmod(_1, _2, 2)`)),
    "MULRSHIFTC#MOD": cat("div", mkfixedn(0xa9be, 16, 8, seq(delta(1, uint8)), `exec_mulshrmod(_1, _2, 2)`)),
    "LSHIFT#ADDDIVMOD": version(4, cat("div", mkfixedn(0xa9d0, 16, 8, seq(delta(1, uint8)), `exec_shldivmod(_1, _2, 2)`))),
    "LSHIFT#ADDDIVMODR": version(4, cat("div", mkfixedn(0xa9d1, 16, 8, seq(delta(1, uint8)), `exec_shldivmod(_1, _2, 2)`))),
    "LSHIFT#ADDDIVMODC": version(4, cat("div", mkfixedn(0xa9d2, 16, 8, seq(delta(1, uint8)), `exec_shldivmod(_1, _2, 2)`))),
    "LSHIFT#DIV": cat("div", mkfixedn(0xa9d4, 16, 8, seq(delta(1, uint8)), `exec_shldivmod(_1, _2, 2)`)),
    "LSHIFT#DIVR": cat("div", mkfixedn(0xa9d5, 16, 8, seq(delta(1, uint8)), `exec_shldivmod(_1, _2, 2)`)),
    "LSHIFT#DIVC": cat("div", mkfixedn(0xa9d6, 16, 8, seq(delta(1, uint8)), `exec_shldivmod(_1, _2, 2)`)),
    "LSHIFT#MOD": cat("div", mkfixedn(0xa9d8, 16, 8, seq(delta(1, uint8)), `exec_shldivmod(_1, _2, 2)`)),
    "LSHIFT#MODR": cat("div", mkfixedn(0xa9d9, 16, 8, seq(delta(1, uint8)), `exec_shldivmod(_1, _2, 2)`)),
    "LSHIFT#MODC": cat("div", mkfixedn(0xa9da, 16, 8, seq(delta(1, uint8)), `exec_shldivmod(_1, _2, 2)`)),
    "LSHIFT#DIVMOD": cat("div", mkfixedn(0xa9dc, 16, 8, seq(delta(1, uint8)), `exec_shldivmod(_1, _2, 2)`)),
    "LSHIFT#DIVMODR": cat("div", mkfixedn(0xa9dd, 16, 8, seq(delta(1, uint8)), `exec_shldivmod(_1, _2, 2)`)),
    "LSHIFT#DIVMODC": cat("div", mkfixedn(0xa9de, 16, 8, seq(delta(1, uint8)), `exec_shldivmod(_1, _2, 2)`)),

    // special case: named argument
    HASHEXT: version(4, cat("crypto", mkfixedn(0xf904, 16, 8, seq(hash), `exec_hash_ext`))),
    HASHEXTR: version(4, cat("crypto", mkfixedn(0xf905, 16, 8, seq(hash), `exec_hash_ext`))),
    HASHEXTA: version(4, cat("crypto", mkfixedn(0xf906, 16, 8, seq(hash), `exec_hash_ext`))),
    HASHEXTAR: version(4, cat("crypto", mkfixedn(0xf907, 16, 8, seq(hash), `exec_hash_ext`))),

    // special case: meaningless long opcodes
    STREF: cat("cell_serialize", mksimple(0xcc, 8, `(_1) => exec_store_ref(_1, false)`)),
    STREF_ALT: cat("cell_serialize", mksimple(0xcf10, 16, `(_1) => exec_store_ref(_1, false)`)),
    STSLICE: cat("cell_serialize", mksimple(0xce, 8, `(_1) => exec_store_slice(_1, false)`)),
    STSLICE_ALT: cat("cell_serialize", mksimple(0xcf12, 16, `(_1) => exec_store_slice(_1, false)`)),
    XCHG3: cat("stack", mkfixedn(0x4, 4, 12, seq(stack(4), stack(4), stack(4)), `exec_xchg3`)),
    XCHG3_ALT: cat("stack", mkfixedn(0x540, 12, 12, seq(stack(4), stack(4), stack(4)), `exec_xchg3`)),
    STI: cat("cell_serialize", mkfixedn(0xca, 8, 8, seq(delta(1, uint8)), `exec_store_int(_1, _2, true)`)),
    STI_ALT: cat("cell_serialize", mkfixedn(0xcf08, 16, 8, seq(delta(1, uint8)), `exec_store_int_fixed`)),
    STU: cat("cell_serialize", mkfixedn(0xcb, 8, 8, seq(delta(1, uint8)), `exec_store_int(_1, _2, false)`)),
    STU_ALT: cat("cell_serialize", mkfixedn(0xcf09, 16, 8, seq(delta(1, uint8)), `exec_store_int_fixed`)),
    LDI: cat("cell_deserialize", mkfixedn(0xd2, 8, 8, seq(delta(1, uint8)), `exec_load_int_fixed(_1, _2, 0)`)),
    LDI_ALT: cat("cell_deserialize", mkfixedn(0xd708, 16, 8, seq(delta(1, uint8)), `exec_load_int_fixed2`)),
    LDU: cat("cell_deserialize", mkfixedn(0xd3, 8, 8, seq(delta(1, uint8)), `exec_load_int_fixed(_1, _2, 1)`)),
    LDU_ALT: cat("cell_deserialize", mkfixedn(0xd709, 16, 8, seq(delta(1, uint8)), `exec_load_int_fixed2`)),
    LDSLICE: cat("cell_deserialize", mkfixedn(0xd6, 8, 8, seq(delta(1, uint8)), `exec_load_slice_fixed`)),
    LDSLICE_ALT: cat("cell_deserialize", mkfixedn(0xd71c, 16, 8, seq(delta(1, uint8)), `exec_load_slice_fixed2`)),

    // special case: with or without arg
    LSHIFT_VAR: cat("shift_logic", mksimple(0xac, 8, `(_1) => exec_lshift(_1, false)`)),
    LSHIFT: cat("shift_logic", mkfixedn(0xaa, 8, 8, seq(delta(1, uint8)), `exec_lshift_tinyint8(_1, _2, false)`)),
    QLSHIFT_VAR: cat("shift_logic", mksimple(0xb7ac, 16, `(_1) => exec_lshift(_1, true)`)),
    QLSHIFT: cat("shift_logic", mkfixedn(0xb7aa, 16, 8, seq(delta(1, uint8)), `exec_lshift_tinyint8(_1, _2, true)`)),
    BCHKBITS_VAR: effects(cat("cell_serialize", mksimple(0xcf39, 16, `(_1) => exec_builder_chk_bits_refs(_1, 1)`)), CanThrow()),
    BCHKBITS: effects(cat("cell_serialize", mkfixedn(0xcf38, 16, 8, seq(delta(1, uint8)), `exec_builder_chk_bits(_1, _2, false)`)), CanThrow()),
    BCHKBITSQ_VAR: cat("cell_serialize", mksimple(0xcf3d, 16, `(_1) => exec_builder_chk_bits_refs(_1, 5)`)),
    BCHKBITSQ: cat("cell_serialize", mkfixedn(0xcf3c, 16, 8, seq(delta(1, uint8)), `exec_builder_chk_bits(_1, _2, true)`)),

    // special case: combination of two above: long version + numbered version
    RSHIFT_VAR: cat("shift_logic", mksimple(0xad, 8, `(_1) => exec_rshift(_1, false)`)),
    RSHIFT: cat("shift_logic", mkfixedn(0xab, 8, 8, seq(delta(1, uint8)), `exec_rshift_tinyint8(_1, _2, false)`)),
    RSHIFT_ALT: cat("div", mksimple(0xa924, 16, `exec_shrmod(_1, _2, 0)`)),
    QRSHIFT_VAR: cat("shift_logic", mksimple(0xb7ad, 16, `(_1) => exec_rshift(_1, true)`)),
    QRSHIFT: cat("shift_logic", mkfixedn(0xb7ab, 16, 8, seq(delta(1, uint8)), `exec_rshift_tinyint8(_1, _2, true)`)),
    QRSHIFT_ALT: cat("div", mksimple(0xb7a924, 24, `exec_shrmod(_1, _2, 1)`)),

    // special case: long and short versions
    CALLDICT: cat("continuation_dict_jump", mkfixedn(0xf0, 8, 8, seq(uint8), `exec_calldict_short`)),
    CALLDICT_LONG: cat("continuation_dict_jump", mkfixedn(0xf10 >> 2, 10, 14, seq(uint14), `exec_calldict`)),

    THROW_SHORT: effects(cat("exception", mkfixedn(0xf20 >> 2, 10, 6, seq(uint6), `exec_throw_fixed(_1, _2, 63, 0)`)), AlwaysThrow()),
    THROW: effects(cat("exception", mkfixedn(0xf2c0 >> 3, 13, 11, seq(uint11), `exec_throw_fixed(_1, _2, 0x7ff, 0)`)), AlwaysThrow()),
    THROWIF_SHORT: effects(cat("exception", mkfixedn(0xf24 >> 2, 10, 6, seq(uint6), `exec_throw_fixed(_1, _2, 63, 3)`)), CanThrow()),
    THROWIF: effects(cat("exception", mkfixedn(0xf2d0 >> 3, 13, 11, seq(uint11), `exec_throw_fixed(_1, _2, 0x7ff, 3)`)), CanThrow()),
    THROWIFNOT_SHORT: effects(cat("exception", mkfixedn(0xf28 >> 2, 10, 6, seq(uint6), `exec_throw_fixed(_1, _2, 63, 2)`)), CanThrow()),
    THROWIFNOT: effects(cat("exception", mkfixedn(0xf2e0 >> 3, 13, 11, seq(uint11), `exec_throw_fixed(_1, _2, 0x7ff, 2)`)), CanThrow()),

    PUSHINT_4: cat("int_const", mkfixedn(0x7, 4, 4, seq(tinyInt), `exec_push_tinyint4`)),
    PUSHINT_8: cat("int_const", mkfixedn(0x80, 8, 8, seq(int8), `exec_push_tinyint8`)),
    PUSHINT_16: cat("int_const", mkfixedn(0x81, 8, 16, seq(int16), `exec_push_smallint`)),
    PUSHINT_LONG: cat("int_const", mkextrange(0x820 << 1, (0x820 << 1) + 31, 13, 5, seq(largeInt), `exec_push_int`)),

    XCHG_01_LONG: cat("stack", mkfixedn(0x11, 8, 8, seq(stack2(8, 1n)), `exec_xchg0_l`)),
    XCHG_0I: cat("stack", mkfixedrangen(0x02, 0x10, 8, 4, seq(stack2(4, 1n)), `exec_xchg0`)),
    XCHG_IJ: cat("stack", mkfixedn(0x10, 8, 8, xchgArgs, `exec_xchg`)),
    XCHG_1I: cat("stack", mkfixedrangen(0x12, 0x20, 8, 4, seq(s1, stack2(4, 2n)), `exec_xchg1`)),

    // special case: opcode with holes
    DUMPSTK: cat("debug", mksimple(0xfe00, 16, `exec_dump_stack`)),
    DEBUG: cat("debug", mkfixedrangen(0xfe01, 0xfe14, 16, 8, seq(uint8), `exec_dummy_debug`)),
    STRDUMP: cat("debug", mksimple(0xfe14, 16, `exec_dump_string`)),
    DEBUG_1: cat("debug", mkfixedrangen(0xfe15, 0xfe20, 16, 8, seq(uint8), `exec_dummy_debug`)),
    DUMP: cat("debug", mkfixedn(0xfe2, 12, 4, seq(stack(4)), `exec_dump_value`)),
    DEBUG_2: cat("debug", mkfixedrangen(0xfe30, 0xfef0, 16, 8, seq(uint8), `exec_dummy_debug`)),

    PUSHCTR: cat("continuation_change", mkfixedrangen(0xed40, 0xed48, 16, 4, seq(control), `exec_push_ctr`)),
    PUSH: cat("stack", mkfixedrangen(0x22, 0x30, 8, 4, seq(stack(4)), `exec_push`)),
    PUSH_LONG: cat("stack", mkfixedn(0x56, 8, 8, seq(stack(8)), `exec_push_l`)),

    POPCTR: cat("continuation_change", mkfixedrangen(0xed50, 0xed58, 16, 4, seq(control), `exec_pop_ctr`)),
    POP: cat("stack", mkfixedrangen(0x32, 0x40, 8, 4, seq(stack(4)), `exec_pop`)),
    POP_LONG: cat("stack", mkfixedn(0x57, 8, 8, seq(stack(8)), `exec_pop_l`)),

    CALLXARGS: cat("continuation_jump", mkfixedn(0xdb0, 12, 4, seq(uint4, minusOne), `exec_callx_args_p`)),
    CALLXARGS_1: cat("continuation_jump", mkfixedn(0xda, 8, 8, seq(uint4, uint4), `exec_callx_args`)),

    PUSHSLICE: cat("cell_const", mkext(0x8b, 8, 4, seq(slice(refs(0), uint4, 4)), `exec_push_slice`)),
    PUSHSLICE_REFS: cat("cell_const", mkext(0x8c, 8, 7, seq(slice(delta(1, uint2), uint5, 1)), `exec_push_slice_r`)),
    PUSHSLICE_LONG: cat("cell_const", mkextrange((0x8d << 3) << 7, ((0x8d << 3) + 5) << 7, 18, 10, seq(slice(uint3, uint7, 6)), `exec_push_slice_r2`)),

    PUSHCONT: cat("cell_const", mkext(0x8e >> 1, 7, 9, seq(codeSlice(uint2, uint7)), `exec_push_cont`)),
    PUSHCONT_SHORT: cat("cell_const", mkext(0x9, 4, 4, seq(inlineCodeSlice(uint4)), `exec_push_cont_simple`)),

    STSLICECONST: cat("cell_serialize", mkext(0xcf80 >> 7, 9, 5, seq(slice(uint2, uint3, 2)), `exec_store_const_slice`)),

    SETCP: cat("codepage", mkfixedrangen(0xff00, 0xfff0, 16, 8, seq(uint8), `exec_set_cp`)),
    SETCPX: cat("codepage", mksimple(0xfff0, 16, `exec_set_cp_any`)),
    SETCP_SHORT: cat("codepage", mkfixedrangen(0xfff1, 0x10000, 16, 8, seq(delta(-256, uint8)), `exec_set_cp`)),

    // SETCP: cat("codepage", mkfixedrangen(0xff00, 0x10000, 16, 8, seq(setcpArg), `exec_set_cp`)),

    PSEUDO_PUSHREF: cat("cell_const", mkfixedpseudo(0, seq(refCodeSlice))),
    PSEUDO_PUSHSLICE: cat("cell_const", mkfixedpseudo(0, seq(slice(refs(1), uint(0, range(0n, 0n)), 0)))),
    PSEUDO_EXOTIC: cat("cell_const", mkfixedpseudo(0, seq(exoticCell))),

    // TVM 11 instructions
    GETPARAMLONG: cat("config", mkfixedrangen(0xf88100, 0xf88111, 24, 8, seq(uint8), `exec_get_var_param_long`)),
    INMSGPARAMS: cat("config", mksimple(0xf88111, 24, `exec_get_param`)),
    GETPARAMLONG2: cat("config", mkfixedrangen(0xf88112, 0xf881ff, 24, 8, seq(uint8), `exec_get_var_param_long`)),
    INMSG_BOUNCE: cat("config", mksimple(0xf890, 16, `exec_get_in_msg_param`)),
    INMSG_BOUNCED: cat("config", mksimple(0xf891, 16, `exec_get_in_msg_param`)),
    INMSG_SRC: cat("config", mksimple(0xf892, 16, `exec_get_in_msg_param`)),
    INMSG_FWDFEE: cat("config", mksimple(0xf893, 16, `exec_get_in_msg_param`)),
    INMSG_LT: cat("config", mksimple(0xf894, 16, `exec_get_in_msg_param`)),
    INMSG_UTIME: cat("config", mksimple(0xf895, 16, `exec_get_in_msg_param`)),
    INMSG_ORIGVALUE: cat("config", mksimple(0xf896, 16, `exec_get_in_msg_param`)),
    INMSG_VALUE: cat("config", mksimple(0xf897, 16, `exec_get_in_msg_param`)),
    INMSG_VALUEEXTRA: cat("config", mksimple(0xf898, 16, `exec_get_in_msg_param`)),
    INMSG_STATEINIT: cat("config", mksimple(0xf899, 16, `exec_get_in_msg_param`)),
    INMSGPARAM: cat("config", mkfixedrangen(0xf89a, 0xf8a0, 16, 4, seq(uint4), `exec_get_var_in_msg_param`)),

    DEBUGMARK: cat("int_const", mkfixedn(0xF955, 16, 16, seq(uint(16, range(0n, 0n))), `exec_push_pow2dec`)),

    fPUSHSLICE: cat("int_const", mkfixedn(0, 0, 0, seq(slice(uint4, uint4, 0)), "")),
    fPUSHCONT: cat("int_const", mkfixedn(0, 0, 0, seq(codeSlice(uint4, uint4)), "")),
    fSTSLICECONST: cat("int_const", mkfixedn(0, 0, 0, seq(slice(uint2, uint3, 2)), "")),
    fXCHG: cat("int_const", mkfixedn(0, 0, 0, seq(stack(4), stack(4)), "")),
    fPUSHINTX: cat("int_const", mkfixedn(0, 0, 0, seq(largeInt), "")),
    fSDBEGINS: cat("int_const", mkfixedn(0, 0, 0, seq(slice(uint4, uint4, 0)), "")),
    fSDBEGINSQ: cat("int_const", mkfixedn(0, 0, 0, seq(slice(uint4, uint4, 0)), "")),
    fCALLXARGS: cat("int_const", mkfixedn(0, 0, 0, seq(uint4, int(8, range(-1n, 15n))), "")),
    fCALLDICT: cat("int_const", mkfixedn(0, 0, 0, seq(uint(16, range(0n, 16383n))), "")),
    fJMPDICT: cat("int_const", mkfixedn(0, 0, 0, seq(uint(16, range(0n, 16383n))), "")),
    fPREPAREDICT: cat("int_const", mkfixedn(0, 0, 0, seq(uint(16, range(0n, 16383n))), "")),
    fTHROW: cat("int_const", mkfixedn(0, 0, 0, seq(uint(16, range(0n, 2047n))), "")),
    fTHROWIF: cat("int_const", mkfixedn(0, 0, 0, seq(uint(16, range(0n, 2047n))), "")),
    fTHROWIFNOT: cat("int_const", mkfixedn(0, 0, 0, seq(uint(16, range(0n, 2047n))), "")),
    fIF: cat("int_const", mkfixedn(0, 0, 0, seq(largeInt, codeSlice(uint4, uint4), codeSlice(uint4, uint4)), "")),
}

export const pseudoInstructions = new Set([
    "PSEUDO_PUSHSLICE",
    "PSEUDO_PUSHREF",
    "PSEUDO_EXOTIC",
])

export const instructionList = (): [string, Opcode][] => {
    return Object.entries(instructions).filter(([name]) => !name.startsWith("f")).map(([rawName, opcode]) => {
        const normalizedNumbers = rawName.startsWith("2") ? rawName.slice(1) + "2" : rawName
        const normalizedHashes = normalizedNumbers.replace("#", "_")
        return [normalizedHashes, opcode]
    })
}

export const fiftInstructionList = (): [string, Opcode][] => {
    return [
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ["fPUSHINT", infoOf("PUSHINT_LONG")!],
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ["fPUSHSLICE", infoOf("fPUSHSLICE")!],
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ["fPUSHCONT", infoOf("fPUSHCONT")!],
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ["fSTSLICECONST", infoOf("fSTSLICECONST")!],
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ["fXCHG", infoOf("fXCHG")!],
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ["fPUSHINTX", infoOf("fPUSHINTX")!],
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ["fSDBEGINS", infoOf("fSDBEGINS")!],
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ["fSDBEGINSQ", infoOf("fSDBEGINSQ")!],
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ["fCALLXARGS", infoOf("fCALLXARGS")!],
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ["fCALLDICT", infoOf("fCALLDICT")!],
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ["fJMPDICT", infoOf("fJMPDICT")!],
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ["fPREPAREDICT", infoOf("fPREPAREDICT")!],
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ["fTHROW", infoOf("fTHROW")!],
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ["fTHROWIF", infoOf("fTHROWIF")!],
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ["fTHROWIFNOT", infoOf("fTHROWIFNOT")!],
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ["fIF", infoOf("fIF")!],
    ]
}

export const infoOf = (name: string): Opcode | undefined => {
    return instructions[name]
}

export const COST_PER_BIT = 1
export const COST_PER_TUPLE_ITEM = 1
export const MAX_TUPLE_ITEMS = 15
export const COST_PRELOAD_INSTR = 10

export const calculateGasConsumption = (instr: Opcode): number[] => {
    const base = instr.skipLen * COST_PER_BIT + COST_PRELOAD_INSTR
    if (!instr.effects || instr.effects.length === 0) {
        return [base]
    }
    return instr.effects.flatMap(effect => effect.costs.map(it => it + base))
}
