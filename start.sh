#!/bin/bash
# Auto-install dependencies and start the deveco-arkts-lsp MCP server.
# Ensures node_modules and dist exist before launch.

set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# Install dependencies if needed
if [ ! -d node_modules ]; then
  npm install --prefer-offline 2>&1 >&2
fi

# Build if dist is missing or src is newer
if [ ! -f dist/index.js ] || [ "$(find src -name '*.ts' -newer dist/index.js 2>/dev/null | head -1)" ]; then
  npm run build 2>&1 >&2
fi

exec node dist/index.js
