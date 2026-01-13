import { dirname, resolve } from 'node:path';

export async function fileExists(path: string): Promise<boolean> {
  const file = Bun.file(path);
  return await file.exists();
}

export async function readFile(path: string): Promise<string> {
  const file = Bun.file(path);
  return await file.text();
}

export async function writeFile(path: string, content: string): Promise<void> {
  await Bun.write(path, content);
}

export async function readJsonFile<T>(path: string): Promise<T> {
  const file = Bun.file(path);
  return (await file.json()) as T;
}

export async function writeJsonFile<T>(path: string, data: T): Promise<void> {
  await Bun.write(path, JSON.stringify(data, null, 2));
}

export async function deleteFile(path: string): Promise<void> {
  await Bun.$`rm -f ${path}`.quiet();
}

export async function deleteDirectory(path: string): Promise<void> {
  await Bun.$`rm -rf ${path}`.quiet();
}

export async function createDirectory(path: string): Promise<void> {
  await Bun.$`mkdir -p ${path}`.quiet();
}

export async function touchFile(path: string): Promise<void> {
  await Bun.$`touch ${path}`.quiet();
}

export function resolvePath(path: string): string {
  if (path.startsWith('~/')) {
    return path.replace('~', process.env.HOME || '~');
  }
  return resolve(path);
}

export async function ensureDirectoryExists(filePath: string): Promise<void> {
  const dir = dirname(filePath);
  await createDirectory(dir);
}
