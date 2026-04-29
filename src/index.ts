import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { LspClient } from './lsp-client.js';
import { findReferences } from './tools/find-references.js';
import { goToDefinition } from './tools/go-to-definition.js';
import { getHover } from './tools/get-hover.js';
import { listSymbols } from './tools/list-symbols.js';
import { findCallHierarchy } from './tools/call-hierarchy.js';

const server = new McpServer({
  name: 'deveco-arkts-lsp',
  version: '1.0.0',
});

const client = new LspClient();

// Tool: find_references
server.tool(
  'find_references',
  'Find all references to a symbol at the given file position. Returns grouped-by-file results with line content.',
  {
    file: z.string().describe('Absolute path to the source file'),
    line: z.number().int().positive().describe('Line number (1-based)'),
    column: z.number().int().positive().describe('Column number (1-based)'),
    includeDeclaration: z.boolean().optional().default(true).describe('Include the declaration itself'),
  },
  async ({ file, line, column, includeDeclaration }) => {
    try {
      const text = await findReferences(client, file, line, column, includeDeclaration);
      return { content: [{ type: 'text' as const, text }] };
    } catch (e: any) {
      return { content: [{ type: 'text' as const, text: `Error: ${e.message}` }], isError: true };
    }
  },
);

// Tool: go_to_definition
server.tool(
  'go_to_definition',
  'Go to the definition of a symbol at the given file position.',
  {
    file: z.string().describe('Absolute path to the source file'),
    line: z.number().int().positive().describe('Line number (1-based)'),
    column: z.number().int().positive().describe('Column number (1-based)'),
  },
  async ({ file, line, column }) => {
    try {
      const text = await goToDefinition(client, file, line, column);
      return { content: [{ type: 'text' as const, text }] };
    } catch (e: any) {
      return { content: [{ type: 'text' as const, text: `Error: ${e.message}` }], isError: true };
    }
  },
);

// Tool: get_hover
server.tool(
  'get_hover',
  'Get type information and documentation for a symbol at the given file position.',
  {
    file: z.string().describe('Absolute path to the source file'),
    line: z.number().int().positive().describe('Line number (1-based)'),
    column: z.number().int().positive().describe('Column number (1-based)'),
  },
  async ({ file, line, column }) => {
    try {
      const text = await getHover(client, file, line, column);
      return { content: [{ type: 'text' as const, text }] };
    } catch (e: any) {
      return { content: [{ type: 'text' as const, text: `Error: ${e.message}` }], isError: true };
    }
  },
);

// Tool: list_symbols
server.tool(
  'list_symbols',
  'List all symbols (functions, classes, variables, etc.) defined in a file.',
  {
    file: z.string().describe('Absolute path to the source file'),
  },
  async ({ file }) => {
    try {
      const text = await listSymbols(client, file);
      return { content: [{ type: 'text' as const, text }] };
    } catch (e: any) {
      return { content: [{ type: 'text' as const, text: `Error: ${e.message}` }], isError: true };
    }
  },
);

// Tool: find_call_hierarchy
server.tool(
  'find_call_hierarchy',
  'Find incoming (callers) or outgoing (callees) call hierarchy for a symbol.',
  {
    file: z.string().describe('Absolute path to the source file'),
    line: z.number().int().positive().describe('Line number (1-based)'),
    column: z.number().int().positive().describe('Column number (1-based)'),
    direction: z.enum(['incoming', 'outgoing']).describe('Direction: incoming (who calls this) or outgoing (what this calls)'),
  },
  async ({ file, line, column, direction }) => {
    try {
      const text = await findCallHierarchy(client, file, line, column, direction);
      return { content: [{ type: 'text' as const, text }] };
    } catch (e: any) {
      return { content: [{ type: 'text' as const, text: `Error: ${e.message}` }], isError: true };
    }
  },
);

// Graceful shutdown
process.on('SIGINT', async () => {
  await client.shutdown();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await client.shutdown();
  process.exit(0);
});

// Start the MCP server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('[deveco-arkts-lsp] MCP server started\n');
}

main().catch((e) => {
  process.stderr.write(`[deveco-arkts-lsp] Fatal: ${e.message}\n`);
  process.exit(1);
});
