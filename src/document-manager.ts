import * as fs from 'node:fs';
import * as path from 'node:path';
import type { MessageConnection } from 'vscode-jsonrpc/node.js';
import { filePathToUri } from './utils/uri.js';

interface TrackedDocument {
  uri: string;
  version: number;
  content: string;
}

export class DocumentManager {
  private documents = new Map<string, TrackedDocument>();

  /** Ensure a file is opened in the LSP server. Re-syncs if content changed on disk. */
  async ensureOpen(connection: MessageConnection, filePath: string): Promise<void> {
    const absPath = path.resolve(filePath);
    const uri = filePathToUri(absPath);
    const content = fs.readFileSync(absPath, 'utf-8');
    const existing = this.documents.get(uri);

    if (!existing) {
      await connection.sendNotification('textDocument/didOpen', {
        textDocument: {
          uri,
          languageId: this.getLanguageId(absPath),
          version: 1,
          text: content,
        },
      });
      this.documents.set(uri, { uri, version: 1, content });
    } else if (existing.content !== content) {
      const newVersion = existing.version + 1;
      await connection.sendNotification('textDocument/didChange', {
        textDocument: { uri, version: newVersion },
        contentChanges: [{ text: content }],
      });
      this.documents.set(uri, { uri, version: newVersion, content });
    }
  }

  reset(): void {
    this.documents.clear();
  }

  private getLanguageId(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.ets': return 'ets';
      case '.ts': return 'typescript';
      case '.tsx': return 'typescriptreact';
      case '.js': return 'javascript';
      case '.jsx': return 'javascriptreact';
      case '.json': case '.json5': case '.jsonc': return 'json';
      default: return 'plaintext';
    }
  }
}
