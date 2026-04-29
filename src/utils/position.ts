import { Position } from 'vscode-languageserver-protocol';
import * as fs from 'node:fs';

/** Convert 1-based line/column (user-facing) to 0-based LSP Position */
export function toLspPosition(line: number, column: number): Position {
  return Position.create(line - 1, column - 1);
}

/** Convert 0-based LSP Position to 1-based line/column */
export function fromLspPosition(pos: Position): { line: number; column: number } {
  return { line: pos.line + 1, column: pos.character + 1 };
}

/** Read a specific line from a file (1-based) */
export function readLineFromFile(filePath: string, line: number): string {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    return lines[line - 1]?.trimEnd() ?? '';
  } catch {
    return '';
  }
}
