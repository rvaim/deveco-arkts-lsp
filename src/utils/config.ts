import * as path from 'node:path';
import * as fs from 'node:fs';

export interface Config {
  sdkPath: string;
  projectPath: string;
  tsdkPath: string | undefined;
  lspCommand: string[];
}

function detectDevEcoPath(): string | undefined {
  const candidates: Record<string, string[]> = {
    darwin: ['/Applications/DevEco-Studio.app'],
    win32: [
      'C:\\Program Files\\Huawei\\DevEco Studio',
      'C:\\Program Files (x86)\\Huawei\\DevEco Studio',
    ],
    linux: ['/opt/deveco-studio', '/usr/local/deveco-studio'],
  };

  const platformCandidates = candidates[process.platform] ?? [];
  for (const p of platformCandidates) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

function resolveSdkPath(devEcoPath: string | undefined): string {
  const sdkSubPaths: Record<string, string> = {
    darwin: 'Contents/sdk/default/openharmony',
    win32: 'sdk/default/openharmony',
    linux: 'sdk/default/openharmony',
  };
  const sub = sdkSubPaths[process.platform] ?? 'sdk/default/openharmony';
  return devEcoPath ? path.join(devEcoPath, sub) : '';
}

export function resolveConfig(): Config {
  const devEcoPath = process.env.DEVECO_PATH || detectDevEcoPath();
  const sdkPath = process.env.OHOS_SDK_PATH || resolveSdkPath(devEcoPath);
  const projectPath = process.env.PROJECT_PATH || process.cwd();
  const tsdkPath = process.env.TSDK_PATH || undefined;

  const lspCommand = process.env.ETS_LSP_BINARY
    ? [process.env.ETS_LSP_BINARY]
    : ['npx', '-y', '@arkts/language-server'];

  return { sdkPath, projectPath, tsdkPath, lspCommand };
}
