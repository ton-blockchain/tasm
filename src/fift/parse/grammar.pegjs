{{}}

SourceFile
  = space* include:IncludeDirective? space* program:Program space* {
    return { $: 'SourceFile', include, program };
  }

IncludeDirective
  = "\"" path:$[^"]+ "\"" space+ "include" space* {
    return { $: 'IncludeDirective', path };
  }

Program
  = "PROGRAM{" space* declarations:Declaration* space* definitions:Definition* space* "}END>c" {
    return { $: 'Program', declarations, definitions };
  }

Declaration
  = space* decl:(ProcDeclaration / MethodDeclaration / GlobalVar) space* {
    return { $: 'Declaration', decl };
  }

ProcDeclaration
  = "DECLPROC" space+ name:Identifier {
    return { $: 'ProcDeclaration', name };
  }

MethodDeclaration
  = method_id:Integer space+ "DECLMETHOD" space+ name:Identifier {
    return { $: 'MethodDeclaration', method_id, name };
  }

GlobalVar
  = "DECLGLOBVAR" space+ name:Identifier {
    return { $: 'GlobalVar', name };
  }

Definition
  = space* def:(ProcDefinition / ProcInlineDefinition / ProcRefDefinition / MethodDefinition) space* {
    return { $: 'Definition', def };
  }

ProcDefinition
  = name:Identifier space* "PROC:<{" space* instructions:Instruction* "}>" {
    return { $: 'ProcDefinition', name, instructions };
  }

ProcInlineDefinition
  = name:Identifier space* "PROCINLINE:<{" space* instructions:Instruction* "}>" {
    return { $: 'ProcInlineDefinition', name, instructions };
  }

ProcRefDefinition
  = name:Identifier space* "PROCREF:<{" space* instructions:Instruction* "}>" {
    return { $: 'ProcRefDefinition', name, instructions };
  }

MethodDefinition
  = name:Identifier space* "METHOD:<{" space* instructions:Instruction* "}>" {
    return { $: 'MethodDefinition', name, instructions };
  }

Instruction
  = space* instr:(IfStatement / IfjmpStatement / WhileStatement / RepeatStatement / UntilStatement / AsmExpression) space* {
    return { $: 'Instruction', instr };
  }

AsmExpression
  = args:AsmArgumentList? space* name:TvmInstruction {
    return { $: 'AsmExpression', arguments: args, name };
  }

AsmArgumentList
  = space* primitives:AsmPrimitive+ {
    return { $: 'AsmArgumentList', primitives };
  }

AsmPrimitive
  = space* prim:(InstructionBlock / String / HexBitString / BinBitString / BocHex / FiftAddressNone / StackRegister / ControlRegister / Integer / ArgIdentifier) space* {
    return { $: 'AsmPrimitive', prim };
  }

IfStatement
  = kind:("IF:<{" / "IFNOT:<{") space* instructions:Instruction* "}>" else_block:("ELSE<{" space* else_instructions:Instruction* "}>" { return { instructions: else_instructions }; })? {
    return { $: 'IfStatement', kind, instructions, else_block: else_block ?? undefined };
  }

IfjmpStatement
  = kind:("IFJMP:<{" / "IFNOTJMP:<{") space* instructions:Instruction* "}>" {
    return { $: 'IfjmpStatement', kind, instructions };
  }

WhileStatement
  = "WHILE:<{" space* condition:Instruction* "}>DO<{" space* body:Instruction* "}>" {
    return { $: 'WhileStatement', condition, body };
  }

RepeatStatement
  = "REPEAT:<{" space* instructions:Instruction* "}>" {
    return { $: 'RepeatStatement', instructions };
  }

UntilStatement
  = "UNTIL:<{" space* instructions:Instruction* "}>" {
    return { $: 'UntilStatement', instructions };
  }

InstructionBlock
  = "<{" space* instructions:Instruction* ("}>c" / "}>s" / "}>CONT" / "}>") {
    return { $: 'InstructionBlock', instructions };
  }

HexBitString
  = "x{" content:$([0-9a-fA-F]* "_"?) "}" {
    return { $: 'HexBitString', content };
  }

BinBitString
  = "b{" content:$[01]* "}" {
    return { $: 'BinBitString', content };
  }

BocHex
  = "B{" content:$[0-9a-fA-F_]+ "}" {
    return { $: 'BocHex', content };
  }

FiftAddressNone
  = "<b" space* "0" space* "2" space* "u," space* "b>" space* "<s" {
    return { $: 'FiftAddressNone' };
  }

Identifier
  = name:$(!reservedWord [a-zA-Z~$_%?.] [a-zA-Z0-9$_%?()~.]*) {
    return { $: 'Identifier', name };
  }

ArgIdentifier
  = name:$(!reservedWord (([A-Z] [a-z]) / [a-z$_%?~.]) [a-zA-Z0-9$_%?()~.]*) {
    return { $: 'ArgIdentifier', name };
  }

TvmInstruction
  = instr:$("-"? [A-Z0-9_#:] [A-Z0-9_#:]+ "l"?) {
    return { $: 'TvmInstruction', value: instr };
  }

Integer
  = value:$("-"? "0b" [01]+) {
    return { $: 'Integer', value };
  }
  / value:$("-"? "0x" [0-9a-fA-F]+) {
    return { $: 'Integer', value };
  }
  / value:$("-"? [0-9]+) {
    return { $: 'Integer', value };
  }

StackRegister
  = value:$("s" [0-9][0-9]?) {
    return { $: 'StackRegister', value };
  }
  / value:$("s(" "-"?[0-9][0-9]? ")") {
    return { $: 'StackRegister', value };
  }
  / value:$([0-9][0-9]?[0-9]? "s()") {
    return { $: 'StackRegister', value };
  }

ControlRegister
  = value:$("c" [0-9][0-9]?) {
    return { $: 'ControlRegister', value };
  }

String
  = "\"" content:$[^"]* "\"" {
    return { $: 'String', content };
  }

reservedWord
  = "PROGRAM" !idChar
  / "END>c" !idChar
  / "DECLPROC" !idChar
  / "DECLMETHOD" !idChar
  / "DECLGLOBVAR" !idChar
  / "PROC:<{" 
  / "PROCINLINE:<{"
  / "PROCREF:<{"
  / "METHOD:<{"
  / "IF:<{"
  / "IFNOT:<{"
  / "ELSE<{"
  / "IFJMP:<{"
  / "IFNOTJMP:<{"
  / "WHILE:<{"
  / "DO<{"
  / "REPEAT:<{"
  / "UNTIL:<{"
  / "<b 0 2 u, b>"
  / "CALLDICT" !idChar
  / "INLINECALLDICT" !idChar

idChar
  = [a-zA-Z0-9$_%?]

space
  = [ \t\r\n] / comment

comment
  = "//" [^\r\n]*
