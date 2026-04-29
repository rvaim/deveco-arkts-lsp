import type { LspClient } from '../lsp-client.js';
import { filePathToUri, uriToFilePath } from '../utils/uri.js';
import { toLspPosition, fromLspPosition } from '../utils/position.js';

interface LspRange {
  start: { line: number; character: number };
  end: { line: number; character: number };
}

interface CallHierarchyItem {
  name: string;
  kind: number;
  uri: string;
  range: LspRange;
  selectionRange: LspRange;
  detail?: string;
}

interface IncomingCall {
  from: CallHierarchyItem;
  fromRanges: LspRange[];
}

interface OutgoingCall {
  to: CallHierarchyItem;
  fromRanges: LspRange[];
}

export async function findCallHierarchy(
  client: LspClient,
  file: string,
  line: number,
  column: number,
  direction: 'incoming' | 'outgoing',
): Promise<string> {
  const connection = await client.getConnection();
  await client.documentManager.ensureOpen(connection, file);

  // Step 1: Prepare call hierarchy item
  const prepareResult = await connection.sendRequest('textDocument/prepareCallHierarchy', {
    textDocument: { uri: filePathToUri(file) },
    position: toLspPosition(line, column),
  }) as CallHierarchyItem[] | null;

  if (!prepareResult || prepareResult.length === 0) {
    return `No call hierarchy available for symbol at ${file}:${line}:${column}`;
  }

  const item = prepareResult[0];
  const lines: string[] = [`Call hierarchy for: ${item.name} (${direction})\n`];

  if (direction === 'incoming') {
    const calls = await connection.sendRequest('callHierarchy/incomingCalls', { item }) as IncomingCall[] | null;
    if (!calls || calls.length === 0) {
      return `No incoming calls found for ${item.name}`;
    }
    for (const call of calls) {
      const filePath = uriToFilePath(call.from.uri);
      const pos = fromLspPosition(call.from.selectionRange.start);
      lines.push(`  <- ${call.from.name}  ${filePath}:${pos.line}:${pos.column}`);
    }
  } else {
    const calls = await connection.sendRequest('callHierarchy/outgoingCalls', { item }) as OutgoingCall[] | null;
    if (!calls || calls.length === 0) {
      return `No outgoing calls found for ${item.name}`;
    }
    for (const call of calls) {
      const filePath = uriToFilePath(call.to.uri);
      const pos = fromLspPosition(call.to.selectionRange.start);
      lines.push(`  -> ${call.to.name}  ${filePath}:${pos.line}:${pos.column}`);
    }
  }

  return lines.join('\n');
}
