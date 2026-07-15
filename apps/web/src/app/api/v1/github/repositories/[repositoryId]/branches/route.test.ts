import { describe, expect, it, vi } from 'vitest';

const { createSupabaseServerClient } = vi.hoisted(() => ({ createSupabaseServerClient: vi.fn() }));
const { listInstallationBranches } = vi.hoisted(() => ({ listInstallationBranches: vi.fn() }));

vi.mock('../../../../../../../lib/supabase/server-client.js', () => ({
  createSupabaseServerClient,
}));
vi.mock('../../../../../../../features/github/github-app-client.js', () => ({
  listInstallationBranches,
}));

import { GET } from './route.js';

describe('GET /api/v1/github/repositories/[repositoryId]/branches', () => {
  it('拒绝无权访问或已撤销的安装', async () => {
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

    const response = await GET(new Request('http://localhost?installationId=installation-id'), {
      params: Promise.resolve({ repositoryId: '456' }),
    });

    expect(response.status).toBe(404);
    expect(listInstallationBranches).not.toHaveBeenCalled();
  });

  it('只返回当前用户有效安装下指定仓库的分支名和 SHA', async () => {
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
    listInstallationBranches.mockResolvedValue([
      { name: 'main', commit: { sha: 'abc123' }, protected: true },
    ]);

    const response = await GET(new Request('http://localhost?installationId=installation-id'), {
      params: Promise.resolve({ repositoryId: '456' }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ branches: [{ name: 'main', sha: 'abc123' }] });
    expect(listInstallationBranches).toHaveBeenCalledWith(123, 456);
  });
});
