import type { LspClient } from '../lsp-client.js';
import { filePathToUri } from '../utils/uri.js';
import { toLspPosition } from '../utils/position.js';

interface LspHoverResult {
  contents: string | { kind: string; value: string } | Array<string | { language: string; value: string }>;
  range?: any;
}

export async function getHover(
  client: LspClient,
  file: string,
  line: number,
  column: number,
): Promise<string> {
  const connection = await client.getConnection();
  await client.documentManager.ensureOpen(connection, file);

  const result = await connection.sendRequest('textDocument/hover', {
    textDocument: { uri: filePathToUri(file) },
    position: toLspPosition(line, column),
  }) as LspHoverResult | null;

  if (!result) {
    return `No hover info for symbol at ${file}:${line}:${column}`;
  }

  const content = result.contents;
  if (typeof content === 'string') {
    return content;
  }
  if ('kind' in content) {
    return content.value;
  }
  if (Array.isArray(content)) {
    return content.map(c => typeof c === 'string' ? c : c.value).join('\n\n');
  }
  return String(content);
}
