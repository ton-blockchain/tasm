# TON Assembly

This repository contains an assembler and disassembler implementation for TVM bitcode.

This implementation provides a complete cycle
`Text -> Internal representation -> Cells -> BoC -> Cells -> Internal representation -> Text`, this means that the same
text assembly can be obtained from a text assembly, going through all the compilation and decompilation steps.

The assembler correctly handles cases where the code does not fit into a single cell and automatically
creates a separate reference for the remaining code.
Current implementation optimizes cases where the reference can be folded into more efficient instructions
(e.g. `IF` into `IFREF`), thereby optimizing gas consumption.

During compilation, the assembler collects additional mappings that can be used to convert the TVM log into a full trace
that will refer to specific instructions in the decompiled version of the contract.

This mapping looks like this:

```
cell-hash + offset -> instruction
```

This implementation is able to generate a coverage report for the contract by BoC and logs
from [Sandbox](https://github.com/ton-org/sandbox).
The proof of concept can be found in the [`./src/coverage`](./src/coverage) folder.

`instructionNameForOpcode()` function can be used to get the name of the instruction for a given opcode, which is useful
for runtime debugging with TVM since TVM itself provides only integer opcodes.

## CLI Tools

This package includes two command-line utilities for working with TON Assembly:

### Assembler

Compile TVM Assembly files to BOC format:

```bash
# Install globally
npm install -g ton-assembly

# Use the assembler
tasm contract.tasm -o contract.boc

# Or via yarn scripts
yarn assembler contract.tasm -o contract.boc
```

### Disassembler

Disassemble BOC files back to TVM Assembly:

```bash
# Use the disassembler
tdisasm contract.boc -o contract.tasm

# Or via yarn scripts
yarn disassembler contract.boc -o contract.tasm
```

Both tools support multiple output formats (binary, hex, base64) and provide verbose output options.

#### Example Usage

```bash
# Compile assembly to BOC
tasm contract.tasm -o contract.boc --verbose

# Disassemble BOC back to assembly
tdisasm contract.boc -o decompiled.tasm --verbose

# Full round-trip test
tasm decompiled.tasm -o recompiled.boc
# contract.boc and recompiled.boc should be identical!

# Work with different formats
tasm contract.tasm -f hex > contract.hex
tdisasm contract.hex -f hex -o contract.tasm

# Assemble from string directly
tasm -s "PUSHINT_4 1" -f hex

# Disassemble from hex/base64 strings directly
tdisasm -s "b5ee9c72410102010027000114ff008e83f4a413ed43d901002fa64ce73b5134348034c7f487f4fffd0115501b05485b1460ec17065c" -f hex -o contract.tasm
tdisasm -s "te6cckEBAgEAJwABFP8AjoP0pBPtQ9kBAC+mTOc7UTQ0gDTH9If0//0BFVAbBUhbFGDsFwZc" -f base64
```

See [CLI documentation](./src/cli/README.md) for detailed usage instructions.

## Library Usage

In addition to the CLI tools, this package can be used as a library for programmatic compilation, decompilation, and log
tracing.

For detailed information, see the [**API Documentation**](API.md).

## Validity

The assembler was tested on 106k contracts from the blockchain
where it successfully decompiled and compiled all contracts into equivalent **Cells**.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

MIT © [TON Studio](https://tonstudio.io).
