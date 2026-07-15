import { describe, expect, it, vi } from 'vitest';

const { createSupabaseServerClient } = vi.hoisted(() => ({ createSupabaseServerClient: vi.fn() }));
const { createZipJob } = vi.hoisted(() => ({ createZipJob: vi.fn() }));

vi.mock('../../../../lib/supabase/server-client.js', () => ({ createSupabaseServerClient }));
vi.mock('../../../../features/jobs/create-zip-job.js', () => ({ createZipJob }));

import { POST } from './route.js';

describe('POST /api/v1/verification-jobs', () => {
  it('未登录时拒绝创建任务', async () => {
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: null } }) },
    });
    const response = await POST(
      new Request('http://localhost/api/v1/verification-jobs', { method: 'POST' }),
    );
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'UNAUTHORIZED', message: '请先登录' },
    });
  });

  it('未激活用户不能创建任务', async () => {
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: 'user-id' } } }) },
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: { access_status: 'invited' } }) }),
        }),
      }),
    });
    const response = await POST(
      new Request('http://localhost/api/v1/verification-jobs', { method: 'POST' }),
    );
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'FORBIDDEN', message: '请先激活内测权限' },
    });
  });

  it('active 用户提交无效任务请求时返回中文 400 错误', async () => {
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: 'user-id' } } }) },
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: { access_status: 'active' } }) }),
        }),
      }),
    });
    const response = await POST(
      new Request('http://localhost/api/v1/verification-jobs', { method: 'POST', body: '{}' }),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'INVALID_REQUEST', message: '请输入有效的验收任务信息' },
    });
  });

  it('active 用户可创建 queued job', async () => {
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: 'user-id' } } }) },
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: { access_status: 'active' } }) }),
        }),
      }),
      storage: { from: () => ({ download: vi.fn() }) },
      rpc: vi.fn(),
    });
    createZipJob.mockResolvedValue({ ok: true, job: { id: 'job-id', status: 'queued' } });
    const response = await POST(
      new Request('http://localhost/api/v1/verification-jobs', {
        method: 'POST',
        body: JSON.stringify({
          requestText: '验证首页',
          source: { type: 'zip', sourceStoragePath: 'user-id/source.zip' },
        }),
      }),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ job: { id: 'job-id', status: 'queued' } });
  });

  it('超出每日额度时返回中文 429 错误', async () => {
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: 'user-id' } } }) },
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: { access_status: 'active' } }) }),
        }),
      }),
    });
    createZipJob.mockResolvedValue({
      ok: false,
      code: 'DAILY_JOB_LIMIT_EXCEEDED',
      message: '今日验收次数已达上限',
    });
    const response = await POST(
      new Request('http://localhost/api/v1/verification-jobs', {
        method: 'POST',
        body: JSON.stringify({
          requestText: '验证首页',
          source: { type: 'zip', sourceStoragePath: 'user-id/source.zip' },
        }),
      }),
    );
    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'DAILY_JOB_LIMIT_EXCEEDED', message: '今日验收次数已达上限' },
    });
  });
});
