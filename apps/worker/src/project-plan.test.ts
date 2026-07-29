import { describe, expect, it } from 'vitest';

import { createProjectPlan, filterProjectFiles } from './project-plan.js';

describe('createProjectPlan', () => {
  it('uses frozen pnpm install when the uploaded project includes a pnpm lockfile', () => {
    expect(
      createProjectPlan(
        {
          dependencies: { vite: '^6.0.0' },
          scripts: { build: 'vite build', dev: 'vite --host 0.0.0.0' },
        },
        'pnpm',
      ),
    ).toMatchObject({ install: 'pnpm install --frozen-lockfile --prefer-offline' });
  });

  it('仅接受带白名单启动脚本的 Vite 项目', () => {
    expect(
      createProjectPlan({
        dependencies: { vite: '^6.0.0' },
        scripts: { build: 'vite build', dev: 'vite --host 0.0.0.0' },
      }),
    ).toEqual({
      framework: 'vite',
      install: 'npm ci',
      build: 'npm run build',
      start: 'npm run dev',
      localUrl: 'http://127.0.0.1:5173',
    });
  });

  it('过滤敏感与依赖目录', () => {
    expect(filterProjectFiles(['src/app.tsx', '.env', '.git/config', 'node_modules/x'])).toEqual([
      'src/app.tsx',
    ]);
  });
});
