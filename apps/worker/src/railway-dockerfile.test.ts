import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

describe('Railway Dockerfile', () => {
  it('使用 TypeScript 运行器启动 Worker，避免 Node 无法解析 .js 导入', async () => {
    const dockerfile = await readFile(new URL('../../../Dockerfile', import.meta.url), 'utf8');
    const workerPackage = await readFile(new URL('../package.json', import.meta.url), 'utf8');

    expect(dockerfile).toContain('node:22');
    expect(dockerfile).toContain('pnpm install --frozen-lockfile');
    expect(dockerfile).toContain('playwright install --with-deps chromium');
    expect(workerPackage).toContain('"start": "tsx src/main.ts"');
  });
});
