import { describe, expect, test } from 'bun:test';
import { existsSync } from 'node:fs';

describe('dataweb CLI', () => {
  test('entry point exists', () => {
    expect(existsSync('src/cli.ts')).toBe(true);
  });

  test('package.json has correct name', async () => {
    const pkg = await Bun.file('package.json').json();
    expect(pkg.name).toBe('dataweb');
  });

  test('package.json has bin entry', async () => {
    const pkg = await Bun.file('package.json').json();
    expect(pkg.bin).toBeDefined();
    expect(pkg.bin.dataweb).toBe('./dist/dataweb');
  });
});
