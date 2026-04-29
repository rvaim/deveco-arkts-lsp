import type { LspClient } from '../lsp-client.js';
import { filePathToUri, uriToFilePath } from '../utils/uri.js';
import { toLspPosition, fromLspPosition, readLineFromFile } from '../utils/position.js';

interface LspLocation {
  uri: string;
  range: { start: { line: number; character: number }; end: { line: number; character: number } };
}

export async function findReferences(
  client: LspClient,
  file: string,
  line: number,
  column: number,
  includeDeclaration: boolean = true,
): Promise<string> {
  const connection = await client.getConnection();
  await client.documentManager.ensureOpen(connection, file);

  const result = await connection.sendRequest('textDocument/references', {
    textDocument: { uri: filePathToUri(file) },
    position: toLspPosition(line, column),
    context: { includeDeclaration },
  }) as LspLocation[] | null;

  if (!result || result.length === 0) {
    return `No references found for symbol at ${file}:${line}:${column}`;
  }

  // Group by file
  const byFile = new Map<string, Array<{ line: number; column: number; text: string }>>();
  for (const loc of result) {
    const filePath = uriToFilePath(loc.uri);
    const pos = fromLspPosition(loc.range.start);
    const text = readLineFromFile(filePath, pos.line);
    if (!byFile.has(filePath)) byFile.set(filePath, []);
    byFile.get(filePath)!.push({ ...pos, text });
  }

  const lines: string[] = [`Found ${result.length} references:\n`];
  for (const [filePath, refs] of byFile) {
    lines.push(`## ${filePath}`);
    for (const ref of refs) {
      lines.push(`  L${ref.line}:${ref.column}  ${ref.text}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
