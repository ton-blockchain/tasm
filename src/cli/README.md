# TON Assembly CLI Tools

This package contains CLI utilities for working with TON and Fift assembly:

## 📦 Assembler (tasm)

Compiles TVM Assembly text files into binary BOC format.

### Usage

```bash
# Via yarn
yarn assembler input.tasm

# Via ts-node directly
ts-node src/cli/assembler.ts input.tasm

# Via npm binary (when installed globally)
tasm input.tasm
```

### Options

- `-o, --output <file>` - Output file path
- `-f, --format <format>` - Output format: `binary` (default), `hex`, `base64`
- `-s, --string <data>` - Input TASM assembly as a string instead of file
- `--verbose` - Verbose output
- `-h, --help` - Show help
- `-v, --version` - Show version

### Examples

```bash
# Compile to binary BOC file
tasm contract.tasm -o contract.boc

# Compile with hex output format
tasm contract.tasm -f hex -o contract.hex

# Compile with verbose output
tasm contract.tasm --verbose

# Output to stdout (hex)
tasm contract.tasm -f hex

# Assemble from string directly
tasm -s "PUSHINT_4 1" -f hex
```

## 🔍 Disassembler (tdisasm)

Disassembles binary BOC files back to TVM Assembly text format.

### Usage

```bash
# Via yarn
yarn disassembler contract.boc

# Via ts-node directly
ts-node src/cli/disassembler.ts contract.boc

# Via npm binary (when installed globally)
tdisasm contract.boc
```

### Options

- `-o, --output <file>` - Output file path
- `-f, --format <format>` - Input format: `binary` (default), `hex`, `base64`
- `-s, --string <data>` - Input data as hex or base64 string instead of file
- `--verbose` - Verbose output
- `-h, --help` - Show help
- `-v, --version` - Show version

### Examples

```bash
# Disassemble binary BOC file
tdisasm contract.boc -o contract.tasm

# Disassemble hex file
tdisasm contract.hex -f hex -o contract.tasm

# Disassemble with verbose output
tdisasm contract.boc --verbose

# Output to stdout
tdisasm contract.boc

# Disassemble from hex string directly
tdisasm -s "b5ee9c72410102010027000114ff008e83f4a413ed43d901002fa64ce73b5134348034c7f487f4fffd0115501b05485b1460ec17065c" -f hex -o contract.tasm

# Disassemble from base64 string directly
tdisasm -s "te6cckEBAgEAJwABFP8AjoP0pBPtQ9kBAC+mTOc7UTQ0gDTH9If0//0BFVAbBUhbFGDsFwZc" -f base64

# Disassemble from hex string to stdout
tdisasm -s "b5ee9c72410102010027000114ff008e83f4a413ed43d901002fa64ce73b5134348034c7f487f4fffd0115501b05485b1460ec17065c" -f hex
```

## ⚡ Fift Assembly Compiler (tfift)

Compiles Fift assembly smart contract source files (from FunC or Tolk) into binary BOC format.

### Usage

```bash
# Via yarn
yarn fift-compiler contract.fif

# Via ts-node directly
ts-node src/cli/fift-compiler.ts contract.fif

# Via npm binary (when installed globally)
tfift contract.fif
```

### Options

- `-o, --output <file>` - Output file path
- `-f, --format <format>` - Output format: `binary` (default), `hex`, `base64`
- `-s, --string <data>` - Input Fift assembly code as a string instead of file
- `--verbose` - Verbose output
- `-h, --help` - Show help
- `-v, --version` - Show version

### Examples

```bash
# Compile to binary BOC file
tfift contract.fif -o contract.boc

# Compile with hex output format
tfift contract.fif -f hex -o contract.hex

# Compile with verbose output
tfift contract.fif --verbose

# Output to stdout (hex)
tfift contract.fif -f hex

# Compile from string directly
tfift -s '"Asm.fif" include
PROGRAM{
  0 DECLMETHOD recv_internal()
  recv_internal() PROC:<{
    42 PUSHINT
  }>
}END>c' -f hex
```

## 🔄 Full Conversion Cycle

The library supports complete conversion cycle:
`Text -> Internal representation -> Cells -> BoC -> Cells -> Internal representation -> Text`

### TASM Assembly Cycle

```bash
# Assemble
tasm source.tasm -o compiled.boc

# Disassemble
tdisasm compiled.boc -o decompiled.tasm

# Re-assemble
tasm decompiled.tasm -o recompiled.boc

# Files compiled.boc and recompiled.boc should be identical!
```

### Fift Assembly Compilation

```bash
# Compile Fift assembly to BOC
tfift contract.fif -o contract.boc

# Disassemble to TASM
tdisasm contract.boc -o contract.tasm

# View the generated assembly
cat contract.tasm
```

## 📝 File Formats

### Input Formats

**Assembler:**

- `.tasm` - TVM Assembly text files
- `string` - TASM assembly provided as a string argument

**Fift Assembly Compiler:**

- `.fif` - Fift assembly smart contract source files
- `string` - Fift assembly code provided as a string argument

**Disassembler:**

- `binary` - Binary BOC files (default)
- `hex` - BOC in hex encoding (text file or string input)
- `base64` - BOC in base64 encoding (text file or string input)

### Output Formats

**Assembler & Fift Assembly Compiler:**

- `binary` - Binary BOC file (default)
- `hex` - BOC in hex encoding
- `base64` - BOC in base64 encoding

**Disassembler:**

- `.tasm` - TVM Assembly text file
