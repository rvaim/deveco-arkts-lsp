import type { LspClient } from '../lsp-client.js';
import { filePathToUri, uriToFilePath } from '../utils/uri.js';
import { toLspPosition, fromLspPosition, readLineFromFile } from '../utils/position.js';

interface LspLocation {
  uri: string;
  range: { start: { line: number; character: number }; end: { line: number; character: number } };
}

interface LspLocationLink {
  targetUri: string;
  targetRange: { start: { line: number; character: number }; end: { line: number; character: number } };
  targetSelectionRange: { start: { line: number; character: number }; end: { line: number; character: number } };
}

export async function goToDefinition(
  client: LspClient,
  file: string,
  line: number,
  column: number,
): Promise<string> {
  const connection = await client.getConnection();
  await client.documentManager.ensureOpen(connection, file);

  const result = await connection.sendRequest('textDocument/definition', {
    textDocument: { uri: filePathToUri(file) },
    position: toLspPosition(line, column),
  }) as LspLocation | LspLocation[] | LspLocationLink[] | null;

  if (!result) {
    return `No definition found for symbol at ${file}:${line}:${column}`;
  }

  const locations = Array.isArray(result) ? result : [result];
  if (locations.length === 0) {
    return `No definition found for symbol at ${file}:${line}:${column}`;
  }

  const lines: string[] = [];
  for (const loc of locations) {
    const uri = 'targetUri' in loc ? (loc as LspLocationLink).targetUri : (loc as LspLocation).uri;
    const range = 'targetRange' in loc ? (loc as LspLocationLink).targetRange : (loc as LspLocation).range;
    const filePath = uriToFilePath(uri);
    const pos = fromLspPosition(range.start);
    const text = readLineFromFile(filePath, pos.line);
    lines.push(`${filePath}:${pos.line}:${pos.column}  ${text}`);
  }

  return `Definition(s):\n${lines.join('\n')}`;
}
