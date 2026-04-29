import type { LspClient } from '../lsp-client.js';
import { filePathToUri } from '../utils/uri.js';
import { fromLspPosition } from '../utils/position.js';

const SYMBOL_KIND_NAMES: Record<number, string> = {
  1: 'File', 2: 'Module', 3: 'Namespace', 4: 'Package',
  5: 'Class', 6: 'Method', 7: 'Property', 8: 'Field',
  9: 'Constructor', 10: 'Enum', 11: 'Interface', 12: 'Function',
  13: 'Variable', 14: 'Constant', 15: 'String', 16: 'Number',
  17: 'Boolean', 18: 'Array', 19: 'Object', 20: 'Key',
  21: 'Null', 22: 'EnumMember', 23: 'Struct', 24: 'Event',
  25: 'Operator', 26: 'TypeParameter',
};

interface LspRange {
  start: { line: number; character: number };
  end: { line: number; character: number };
}

interface LspDocumentSymbol {
  name: string;
  kind: number;
  range: LspRange;
  selectionRange: LspRange;
  children?: LspDocumentSymbol[];
}

interface LspSymbolInformation {
  name: string;
  kind: number;
  location: { uri: string; range: LspRange };
}

type SymbolResult = LspDocumentSymbol | LspSymbolInformation;

export async function listSymbols(
  client: LspClient,
  file: string,
): Promise<string> {
  const connection = await client.getConnection();
  await client.documentManager.ensureOpen(connection, file);

  const result = await connection.sendRequest('textDocument/documentSymbol', {
    textDocument: { uri: filePathToUri(file) },
  }) as SymbolResult[] | null;

  if (!result || result.length === 0) {
    return `No symbols found in ${file}`;
  }

  const lines: string[] = [`Symbols in ${file}:\n`];

  function formatSymbol(sym: SymbolResult, indent: number): void {
    const kind = SYMBOL_KIND_NAMES[sym.kind] || `Kind(${sym.kind})`;
    if ('range' in sym && !('location' in sym)) {
      const docSym = sym as LspDocumentSymbol;
      const pos = fromLspPosition(docSym.range.start);
      const prefix = '  '.repeat(indent);
      lines.push(`${prefix}${kind} ${docSym.name}  (L${pos.line})`);
      if (docSym.children) {
        for (const child of docSym.children) {
          formatSymbol(child, indent + 1);
        }
      }
    } else {
      const symInfo = sym as LspSymbolInformation;
      const pos = fromLspPosition(symInfo.location.range.start);
      lines.push(`  ${kind} ${symInfo.name}  (L${pos.line})`);
    }
  }

  for (const sym of result) {
    formatSymbol(sym, 0);
  }

  return lines.join('\n');
}
