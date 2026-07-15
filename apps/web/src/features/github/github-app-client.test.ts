import { describe, expect, it, vi } from 'vitest';

import {
  getInstallationAccountLogin,
  listInstallationBranches,
  listInstallationRepositories,
} from './github-app-client.js';

describe('getInstallationAccountLogin', () => {
  it('只以 App JWT 读取安装所属账号名，不向调用方暴露凭据', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ account: { login: 'verified-account' } }), { status: 200 }),
      );

    const result = await getInstallationAccountLogin(123, {
      fetch,
      createAppJwt: async () => 'test-app-jwt',
    });

    expect(result).toEqual({ ok: true, accountLogin: 'verified-account' });
    expect(fetch).toHaveBeenCalledWith(
      'https://api.github.com/app/installations/123',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-app-jwt' }),
      }),
    );
  });

  it('将 GitHub 响应异常映射为不包含敏感信息的稳定错误', async () => {
    const result = await getInstallationAccountLogin(123, {
      fetch: vi.fn().mockResolvedValue(new Response('upstream detail', { status: 403 })),
      createAppJwt: async () => 'test-app-jwt',
    });

    expect(result).toEqual({
      ok: false,
      code: 'GITHUB_INSTALLATION_LOOKUP_FAILED',
      message: '无法确认 GitHub 安装信息',
    });
  });

  it('用短期安装令牌读取仓库，但不将令牌放入返回值', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ token: 'short-lived-token' }), { status: 201 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            repositories: [
              { id: 1, full_name: 'owner/private', private: true, default_branch: 'main' },
            ],
          }),
          {
            status: 200,
          },
        ),
      );

    const repositories = await listInstallationRepositories(123, {
      fetch,
      createAppJwt: async () => 'test-app-jwt',
    });

    expect(repositories).toEqual([
      { id: 1, full_name: 'owner/private', private: true, default_branch: 'main' },
    ]);
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      'https://api.github.com/app/installations/123/access_tokens',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer test-app-jwt' }),
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      'https://api.github.com/installation/repositories',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer short-lived-token' }),
      }),
    );
    expect(JSON.stringify(repositories)).not.toContain('short-lived-token');
  });

  it('用短期安装令牌读取指定仓库的分支', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ token: 'short-lived-token' }), { status: 201 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ name: 'main', commit: { sha: 'abc123' } }]), {
          status: 200,
        }),
      );

    const branches = await listInstallationBranches(123, 456, {
      fetch,
      createAppJwt: async () => 'test-app-jwt',
    });

    expect(branches).toEqual([{ name: 'main', commit: { sha: 'abc123' } }]);
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      'https://api.github.com/repositories/456/branches',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer short-lived-token' }),
      }),
    );
    expect(JSON.stringify(branches)).not.toContain('short-lived-token');
  });
});
