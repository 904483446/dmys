import { describe, expect, it, vi } from 'vitest';

const { createSupabaseServerClient } = vi.hoisted(() => ({ createSupabaseServerClient: vi.fn() }));

vi.mock('../../../../../../../lib/supabase/server-client.js', () => ({
  createSupabaseServerClient,
}));

import { POST } from './route.js';

const context = { params: Promise.resolve({ installationId: 'installation-id' }) };

describe('POST /api/v1/github/installations/[installationId]/revoke', () => {
  it('对当前用户不可见的安装返回 404，且不执行撤销写入', async () => {
    const update = vi.fn();
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: 'user-id' } } }) },
      from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }),
        update,
      }),
    });

    const response = await POST(new Request('http://localhost'), context);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'GITHUB_INSTALLATION_NOT_FOUND', message: '未找到 GitHub 安装记录' },
    });
    expect(update).not.toHaveBeenCalled();
  });

  it('拒绝重复撤销已经撤销的安装', async () => {
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: 'user-id' } } }) },
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: { id: 'installation-id', revoked_at: '2026-01-01T00:00:00.000Z' },
            }),
          }),
        }),
      }),
    });

    const response = await POST(new Request('http://localhost'), context);

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'GITHUB_INSTALLATION_REVOKED', message: 'GitHub 安装已撤销' },
    });
  });

  it('仅撤销当前用户自己的有效安装', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: 'installation-id' } });
    const update = vi.fn(() => ({ eq: () => ({ select: () => ({ maybeSingle }) }) }));
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: 'user-id' } } }) },
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: { id: 'installation-id', revoked_at: null } }),
          }),
        }),
        update,
      }),
    });

    const response = await POST(new Request('http://localhost'), context);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      installation: { id: 'installation-id', revokedAt: expect.any(String) },
    });
    expect(update).toHaveBeenCalledWith({ revoked_at: expect.any(String) });
  });
});
