import { resolve } from 'node:path';

export async function validateBrunoCLI(): Promise<boolean> {
  try {
    const result = await Bun.$`bru --version`.quiet();
    return result.exitCode === 0;
  } catch {
    return false;
  }
}

export async function validatePath(path: string): Promise<boolean> {
  try {
    const resolvedPath = resolve(path);
    const file = Bun.file(resolvedPath);
    // Check if path exists (as either file or directory)
    const exists = await file.exists();
    if (exists) return true;

    // Try to check if it's a directory
    const dirCheck = await Bun.$`test -d ${resolvedPath}`.quiet();
    return dirCheck.exitCode === 0;
  } catch {
    return false;
  }
}

export async function validateBackendPath(
  path: string,
): Promise<{ valid: boolean; message?: string }> {
  const resolvedPath = resolve(path);
  const pathExists = await validatePath(resolvedPath);

  if (!pathExists) {
    return {
      valid: false,
      message: `Path does not exist: ${resolvedPath}`,
    };
  }

  // Check if services directory exists
  const servicesPath = `${resolvedPath}/services`;
  const servicesExists = await validatePath(servicesPath);

  if (!servicesExists) {
    return {
      valid: false,
      message: `Services directory not found at: ${servicesPath}`,
    };
  }

  return { valid: true };
}

export async function validateBrunoPath(
  path: string,
): Promise<{ valid: boolean; message?: string }> {
  const resolvedPath = resolve(path);
  const pathExists = await validatePath(resolvedPath);

  if (!pathExists) {
    // Path doesn't exist - that's ok, we'll create it
    return { valid: true };
  }

  return { valid: true };
}

export function expandTildePath(path: string): string {
  if (path.startsWith('~/')) {
    return path.replace('~', process.env.HOME || '~');
  }
  return path;
}

export function validateNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}
