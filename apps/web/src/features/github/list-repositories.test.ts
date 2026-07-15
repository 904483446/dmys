import { describe, expect, it } from 'vitest';

import { listRepositories } from './list-repositories.js';

describe('listRepositories', () => {
  it('仅映射验收所需的私有仓库字段', async () => {
    const result = await listRepositories({
      installationId: 123,
      list: async () => [
        {
          id: 1,
          full_name: 'private-owner/private-repository',
          private: true,
          default_branch: 'main',
          clone_url: 'https://private.example/secret.git',
        },
      ],
    });

    expect(result).toEqual({
      ok: true,
      repositories: [
        {
          id: 1,
          fullName: 'private-owner/private-repository',
          private: true,
          defaultBranch: 'main',
        },
      ],
    });
    expect(JSON.stringify(result)).not.toContain('clone_url');
  });

  it('将上游失败映射为不包含凭据的稳定错误', async () => {
    const result = await listRepositories({
      installationId: 123,
      list: async () => {
        throw new Error('token');
      },
    });

    expect(result).toEqual({
      ok: false,
      code: 'GITHUB_REPOSITORIES_UNAVAILABLE',
      message: '暂时无法读取 GitHub 仓库',
    });
  });
});
