import { spawn } from 'node:child_process';

const [command, ...args] = process.argv.slice(2);
const expectedToolCount = Number.parseInt(process.env.EXPECTED_TOOL_COUNT || '', 10);

if (!command) {
  throw new Error('缺少 MCP 可执行命令');
}
if (!Number.isInteger(expectedToolCount) || expectedToolCount <= 0) {
  throw new Error('EXPECTED_TOOL_COUNT 必须是正整数');
}

const child = spawn(command, args, {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: process.env
});

let pendingOutput = '';
let stderr = '';
let initialized = false;
let completed = false;
let serverInfo;
let timeoutId;

const finish = (error, result) => {
  if (completed) {
    return;
  }
  completed = true;
  clearTimeout(timeoutId);
  child.kill('SIGTERM');

  if (error) {
    process.stderr.write(`${error.message}\n${stderr}`);
    process.exitCode = 1;
    return;
  }

  process.stdout.write(`${JSON.stringify(result)}\n`);
};

const processLine = (line) => {
  let message;
  try {
    message = JSON.parse(line);
  } catch {
    return;
  }

  if (message.id === 1 && !initialized) {
    initialized = true;
    serverInfo = message.result?.serverInfo;
    child.stdin.write(`${JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/initialized'
    })}\n`);
    child.stdin.write(`${JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    })}\n`);
    return;
  }

  if (message.id === 2) {
    const toolNames = message.result?.tools?.map((tool) => tool.name);
    if (!Array.isArray(toolNames)) {
      finish(new Error('MCP tools/list 没有返回工具列表'));
      return;
    }
    if (toolNames.length !== expectedToolCount) {
      finish(new Error(
        `MCP 工具数量不正确：期望 ${expectedToolCount}，实际 ${toolNames.length}`
      ));
      return;
    }
    finish(undefined, {
      serverInfo,
      toolCount: toolNames.length,
      toolNames
    });
  }
};

child.stdout.on('data', (chunk) => {
  pendingOutput += chunk.toString();
  let newlineIndex = pendingOutput.indexOf('\n');
  while (newlineIndex >= 0) {
    const line = pendingOutput.slice(0, newlineIndex).trim();
    pendingOutput = pendingOutput.slice(newlineIndex + 1);
    if (line) {
      processLine(line);
    }
    newlineIndex = pendingOutput.indexOf('\n');
  }
});

child.stderr.on('data', (chunk) => {
  stderr += chunk.toString();
});

child.on('error', (error) => finish(error));
child.on('exit', (code) => {
  if (!completed) {
    finish(new Error(`MCP 进程提前退出，退出码：${code}`));
  }
});

child.stdin.write(`${JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2025-03-26',
    capabilities: {},
    clientInfo: {
      name: 'rvaim-package-smoke-test',
      version: '1.0.0'
    }
  }
})}\n`);

timeoutId = setTimeout(() => {
  finish(new Error('MCP 握手验证超时'));
}, 60000);
