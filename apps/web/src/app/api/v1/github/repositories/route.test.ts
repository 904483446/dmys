import { describe, expect, it, vi } from 'vitest';

const { createSupabaseServerClient } = vi.hoisted(() => ({ createSupabaseServerClient: vi.fn() }));
const { listInstallationRepositories } = vi.hoisted(() => ({
  listInstallationRepositories: vi.fn(),
}));

vi.mock('../../../../../lib/supabase/server-client.js', () => ({ createSupabaseServerClient }));
vi.mock('../../../../../features/github/github-app-client.js', () => ({
  listInstallationRepositories,
}));

import { GET } from './route.js';

describe('GET /api/v1/github/repositories', () => {
  it('拒绝当前用户无权访问或已撤销的安装', async () => {
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: 'user-id' } } }) },
      from: (table: string) =>
        table === 'profiles'
          ? {
              select: () => ({
                eq: () => ({ maybeSingle: async () => ({ data: { access_status: 'active' } }) }),
              }),
            }
          : {
              select: () => ({
                eq: () => ({ is: () => ({ maybeSingle: async () => ({ data: null }) }) }),
              }),
            },
    });

    const response = await GET(
      new Request('http://localhost/api/v1/github/repositories?installationId=installation-id'),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'GITHUB_INSTALLATION_NOT_FOUND', message: '未找到可用的 GitHub 安装记录' },
    });
    expect(listInstallationRepositories).not.toHaveBeenCalled();
  });

  it('只返回当前用户有效安装中的脱敏仓库字段', async () => {
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: 'user-id' } } }) },
      from: (table: string) =>
        table === 'profiles'
          ? {
              select: () => ({
                eq: () => ({ maybeSingle: async () => ({ data: { access_status: 'active' } }) }),
              }),
            }
          : {
              select: () => ({
                eq: () => ({
                  is: () => ({ maybeSingle: async () => ({ data: { installation_id: 123 } }) }),
                }),
              }),
            },
    });
    listInstallationRepositories.mockResolvedValue([
      {
        id: 1,
        full_name: 'owner/private',
        private: true,
        default_branch: 'main',
        clone_url: 'private',
      },
    ]);

    const response = await GET(
      new Request('http://localhost/api/v1/github/repositories?installationId=installation-id'),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      repositories: [{ id: 1, fullName: 'owner/private', private: true, defaultBranch: 'main' }],
    });
    expect(listInstallationRepositories).toHaveBeenCalledWith(123);
  });
});
