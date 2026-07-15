import { describe, expect, it, vi } from 'vitest';

const { createSupabaseServerClient } = vi.hoisted(() => ({ createSupabaseServerClient: vi.fn() }));
const { getInstallationAccountLogin } = vi.hoisted(() => ({
  getInstallationAccountLogin: vi.fn(),
}));

vi.mock('../../../../../../lib/supabase/server-client.js', () => ({ createSupabaseServerClient }));
vi.mock('../../../../../../features/github/github-app-client.js', () => ({
  getInstallationAccountLogin,
}));

import { createInstallState } from '../../../../../../features/github/install-state.js';
import { GET } from './route.js';

describe('GET /api/v1/github/installations/callback', () => {
  it('拒绝未激活用户的安装回调', async () => {
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: 'user-id' } } }) },
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: { access_status: 'invited' } }) }),
        }),
      }),
    });

    const response = await GET(
      new Request('http://localhost/api/v1/github/installations/callback'),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'FORBIDDEN', message: '请先激活内测权限' },
    });
    expect(getInstallationAccountLogin).not.toHaveBeenCalled();
  });

  it('拒绝无效 state，且不查询或写入 GitHub 安装信息', async () => {
    const upsert = vi.fn();
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: 'user-id' } } }) },
      from: () => ({
        upsert,
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: { access_status: 'active' } }) }),
        }),
      }),
    });
    vi.stubEnv('GITHUB_STATE_ENCRYPTION_KEY', 'test-state-secret');

    const response = await GET(
      new Request(
        'http://localhost/api/v1/github/installations/callback?installation_id=123&state=invalid',
      ),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: 'INVALID_GITHUB_INSTALLATION_STATE',
        message: 'GitHub 安装请求已失效，请重新发起连接',
      },
    });
    expect(getInstallationAccountLogin).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it('验证 state 后，将可信账号名绑定到当前会话用户并跳回设置页', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: 'user-id' } } }) },
      from: () => ({
        upsert,
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: { access_status: 'active' } }) }),
        }),
      }),
    });
    getInstallationAccountLogin.mockResolvedValue({ ok: true, accountLogin: 'verified-account' });
    vi.stubEnv('GITHUB_STATE_ENCRYPTION_KEY', 'test-state-secret');
    vi.useFakeTimers();
    vi.setSystemTime(new Date(101_000));
    const state = createInstallState({
      userId: 'user-id',
      now: 100,
      secret: 'test-state-secret',
      nonce: 'nonce',
    });

    const response = await GET(
      new Request(
        `http://localhost/api/v1/github/installations/callback?installation_id=123&state=${encodeURIComponent(state)}`,
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/settings');
    expect(getInstallationAccountLogin).toHaveBeenCalledWith(123);
    expect(upsert).toHaveBeenCalledWith(
      {
        user_id: 'user-id',
        installation_id: 123,
        account_login: 'verified-account',
        revoked_at: null,
      },
      { onConflict: 'installation_id' },
    );
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });
});
