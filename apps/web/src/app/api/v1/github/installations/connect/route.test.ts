import { describe, expect, it, vi } from 'vitest';

const { createSupabaseServerClient } = vi.hoisted(() => ({ createSupabaseServerClient: vi.fn() }));

vi.mock('../../../../../../lib/supabase/server-client.js', () => ({ createSupabaseServerClient }));

import { POST } from './route.js';

describe('POST /api/v1/github/installations/connect', () => {
  it('未登录时拒绝发起 GitHub 安装', async () => {
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: null } }) },
    });
    const response = await POST();
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'UNAUTHORIZED', message: '请先登录' },
    });
  });

  it('未激活用户不能发起 GitHub 安装', async () => {
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: 'user-id' } } }) },
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: { access_status: 'invited' } }) }),
        }),
      }),
    });
    const response = await POST();
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'FORBIDDEN', message: '请先激活内测权限' },
    });
  });

  it('激活用户获得不泄露用户标识或令牌的安装地址', async () => {
    vi.stubEnv('GITHUB_APP_SLUG', 'vibeverify-test');
    vi.stubEnv('GITHUB_STATE_ENCRYPTION_KEY', 'test-state-secret');
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: 'user-id' } } }) },
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: { access_status: 'active' } }) }),
        }),
      }),
    });

    const response = await POST();

    expect(response.status).toBe(200);
    const body = (await response.json()) as { installUrl: string };
    expect(body.installUrl).toMatch(
      /^https:\/\/github\.com\/apps\/vibeverify-test\/installations\/new\?state=/,
    );
    expect(body.installUrl).not.toContain('user-id');
    expect(body.installUrl).not.toContain('token');
    vi.unstubAllEnvs();
  });
});
