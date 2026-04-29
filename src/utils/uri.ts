import { URI } from 'vscode-uri';

export function filePathToUri(filePath: string): string {
  return URI.file(filePath).toString();
}

export function uriToFilePath(uri: string): string {
  return URI.parse(uri).fsPath;
}
