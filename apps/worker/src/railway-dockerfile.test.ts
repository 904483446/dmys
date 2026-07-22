import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

describe('Railway Dockerfile', () => {
  it('从仓库根目录安装锁定依赖并启动 Worker', async () => {
    const dockerfile = await readFile(new URL('../../../Dockerfile', import.meta.url), 'utf8');

    expect(dockerfile).toContain('node:22');
    expect(dockerfile).toContain('pnpm install --frozen-lockfile');
    expect(dockerfile).toContain('playwright install --with-deps chromium');
    expect(dockerfile).toMatch(
      /CMD\s+\["pnpm",\s*"--filter",\s*"@vibeverify\/worker",\s*"start"\]/,
    );
  });
});
