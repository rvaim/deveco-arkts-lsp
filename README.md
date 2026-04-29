# deveco-arkts-lsp

An MCP (Model Context Protocol) server that bridges the ArkTS/HarmonyOS Language Server to AI coding assistants like Claude Code. It exposes IDE-level code intelligence — find references, go to definition, hover, symbols, and call hierarchy — as MCP tools.

## Prerequisites

- **Node.js** >= 20
- **ArkTS Language Server** — one of:
  - `@arkts/language-server` (installed automatically via npx on first run)
  - Or a custom LSP binary (set via `ETS_LSP_BINARY` env var)
- **HarmonyOS SDK** — installed via [DevEco Studio](https://developer.huawei.com/consumer/en/deveco-studio/) or standalone

## Quick Start

```bash
# Clone the repo
git clone https://gitcode.com/openharmony-mcp/deveco-arkts-lsp.git
cd deveco-arkts-lsp

# Install dependencies
npm install

# Build
npm run build

# Run (requires PROJECT_PATH to be set)
PROJECT_PATH=/path/to/your/harmonyos/project node dist/index.js
```

## Configuration

All configuration is done via environment variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PROJECT_PATH` | Yes | `process.cwd()` | Absolute path to the HarmonyOS project root |
| `OHOS_SDK_PATH` | No | Auto-detected from DevEco Studio | Path to the OpenHarmony SDK |
| `DEVECO_PATH` | No | Platform default (see below) | Path to DevEco Studio installation |
| `ETS_LSP_BINARY` | No | `npx -y @arkts/language-server` | Custom LSP server binary path |
| `TSDK_PATH` | No | Auto-resolved | TypeScript SDK path |

### DevEco Studio Default Paths

| Platform | Default Path |
|----------|-------------|
| macOS | `/Applications/DevEco-Studio.app` |
| Windows | `C:\Program Files\Huawei\DevEco Studio` |
| Linux | `/opt/deveco-studio` |

## MCP Tools

### `find_references`
Find all references to a symbol at the given file position.

**Parameters:**
- `file` (string) — Absolute path to the source file
- `line` (number) — Line number (1-based)
- `column` (number) — Column number (1-based)
- `includeDeclaration` (boolean, optional) — Include the declaration itself (default: true)

### `go_to_definition`
Go to the definition of a symbol at the given file position.

**Parameters:**
- `file` (string) — Absolute path to the source file
- `line` (number) — Line number (1-based)
- `column` (number) — Column number (1-based)

### `get_hover`
Get type information and documentation for a symbol at the given file position.

**Parameters:**
- `file` (string) — Absolute path to the source file
- `line` (number) — Line number (1-based)
- `column` (number) — Column number (1-based)

### `list_symbols`
List all symbols (functions, classes, variables, etc.) defined in a file.

**Parameters:**
- `file` (string) — Absolute path to the source file

### `find_call_hierarchy`
Find incoming (callers) or outgoing (callees) call hierarchy for a symbol.

**Parameters:**
- `file` (string) — Absolute path to the source file
- `line` (number) — Line number (1-based)
- `column` (number) — Column number (1-based)
- `direction` (`"incoming"` | `"outgoing"`) — Direction of the call hierarchy

## Usage with Claude Code

Add to your Claude Code MCP settings (`.claude/settings.json`):

```json
{
  "mcpServers": {
    "deveco-arkts-lsp": {
      "command": "node",
      "args": ["/path/to/deveco-arkts-lsp/dist/index.js"],
      "env": {
        "PROJECT_PATH": "/path/to/your/harmonyos/project"
      }
    }
  }
}
```

Or use the provided `start.sh` script which handles auto-install and auto-build:

```json
{
  "mcpServers": {
    "deveco-arkts-lsp": {
      "command": "bash",
      "args": ["/path/to/deveco-arkts-lsp/start.sh"],
      "env": {
        "PROJECT_PATH": "/path/to/your/harmonyos/project"
      }
    }
  }
}
```

## Architecture

```
┌─────────────────┐     stdio      ┌──────────────────┐     stdio      ┌─────────────────┐
│   AI Assistant   │ ◄──────────► │ deveco-arkts-lsp  │ ◄──────────► │  ArkTS Language  │
│  (Claude Code)   │    (MCP)      │   (this server)   │    (LSP)      │     Server       │
└─────────────────┘               └──────────────────┘               └─────────────────┘
```

The server acts as a bridge:
1. Receives MCP tool calls from the AI assistant
2. Translates them into LSP protocol requests
3. Forwards to the ArkTS Language Server
4. Formats the LSP responses back as MCP tool results

## License

[MIT](LICENSE)
