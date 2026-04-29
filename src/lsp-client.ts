import { spawn, type ChildProcess } from 'node:child_process';
import * as path from 'node:path';
import {
  createMessageConnection,
  StreamMessageReader,
  StreamMessageWriter,
  type MessageConnection,
} from 'vscode-jsonrpc/node.js';
import { DocumentManager } from './document-manager.js';
import { resolveConfig, type Config } from './utils/config.js';
import { filePathToUri } from './utils/uri.js';

export class LspClient {
  private connection: MessageConnection | null = null;
  private process: ChildProcess | null = null;
  private initialized = false;
  private initializing: Promise<void> | null = null;
  private config: Config;
  readonly documentManager = new DocumentManager();

  constructor() {
    this.config = resolveConfig();
  }

  /** Get an initialized LSP connection, starting the server if needed */
  async getConnection(): Promise<MessageConnection> {
    if (this.connection && this.initialized) {
      return this.connection;
    }
    if (this.initializing) {
      await this.initializing;
      return this.connection!;
    }
    this.initializing = this.start();
    await this.initializing;
    this.initializing = null;
    return this.connection!;
  }

  private async start(): Promise<void> {
    this.cleanup();

    const [cmd, ...args] = this.config.lspCommand;
    const child = spawn(cmd, [...args, '--stdio'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    this.process = child;

    child.stderr?.on('data', (data: Buffer) => {
      process.stderr.write(`[ets-lsp] ${data.toString()}`);
    });

    child.on('exit', (code) => {
      process.stderr.write(`[ets-lsp] exited with code ${code}\n`);
      this.connection = null;
      this.initialized = false;
      this.documentManager.reset();
    });

    const connection = createMessageConnection(
      new StreamMessageReader(child.stdout!),
      new StreamMessageWriter(child.stdin!),
    );

    connection.listen();
    this.connection = connection;

    // Send initialize request using string method name to avoid type conflicts
    const initParams = {
      processId: process.pid,
      capabilities: {
        textDocument: {
          references: { dynamicRegistration: false },
          definition: { dynamicRegistration: false, linkSupport: true },
          hover: { contentFormat: ['markdown', 'plaintext'] },
          documentSymbol: { hierarchicalDocumentSymbolSupport: true },
          rename: { dynamicRegistration: false },
        },
        workspace: {
          workspaceFolders: true,
        },
      },
      rootUri: filePathToUri(this.config.projectPath),
      workspaceFolders: [{
        uri: filePathToUri(this.config.projectPath),
        name: path.basename(this.config.projectPath),
      }],
      initializationOptions: {
        ets: {
          sdkPath: this.config.sdkPath,
        },
        ...(this.config.tsdkPath ? { typescript: { tsdk: this.config.tsdkPath } } : {}),
      },
    };

    const result = await connection.sendRequest('initialize', initParams) as any;
    process.stderr.write(`[ets-lsp] initialized, capabilities: ${JSON.stringify(Object.keys(result.capabilities))}\n`);

    await connection.sendNotification('initialized', {});
    this.initialized = true;
  }

  /** Gracefully shut down the LSP server */
  async shutdown(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.sendRequest('shutdown');
        await this.connection.sendNotification('exit');
      } catch {
        // Ignore errors during shutdown
      }
    }
    this.cleanup();
  }

  private cleanup(): void {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    if (this.connection) {
      this.connection.dispose();
      this.connection = null;
    }
    this.initialized = false;
    this.documentManager.reset();
  }
}
