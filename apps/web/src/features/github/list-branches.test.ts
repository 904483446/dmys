import { describe, expect, it } from 'vitest';

import { listBranches } from './list-branches.js';

describe('listBranches', () => {
  it('仅映射验收所需的分支名和提交 SHA', async () => {
    const result = await listBranches({
      installationId: 123,
      repositoryId: 456,
      list: async () => [{ name: 'main', commit: { sha: 'abc123' }, protected: true }],
    });

    expect(result).toEqual({ ok: true, branches: [{ name: 'main', sha: 'abc123' }] });
    expect(JSON.stringify(result)).not.toContain('protected');
  });

  it('将上游失败映射为不包含凭据的稳定错误', async () => {
    const result = await listBranches({
      installationId: 123,
      repositoryId: 456,
      list: async () => {
        throw new Error('token');
      },
    });

    expect(result).toEqual({
      ok: false,
      code: 'GITHUB_BRANCHES_UNAVAILABLE',
      message: '暂时无法读取 GitHub 分支',
    });
  });
});
