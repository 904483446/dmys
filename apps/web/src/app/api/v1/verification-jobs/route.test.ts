import { describe, expect, it, vi } from 'vitest';

const { createSupabaseServerClient } = vi.hoisted(() => ({ createSupabaseServerClient: vi.fn() }));
const { createZipJob } = vi.hoisted(() => ({ createZipJob: vi.fn() }));
const { listInstallationRepositories } = vi.hoisted(() => ({
  listInstallationRepositories: vi.fn(),
}));

vi.mock('../../../../lib/supabase/server-client.js', () => ({ createSupabaseServerClient }));
vi.mock('../../../../features/jobs/create-zip-job.js', () => ({ createZipJob }));
vi.mock('../../../../features/github/github-app-client.js', () => ({
  listInstallationRepositories,
}));

import { GET, POST } from './route.js';

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

describe('GET /api/v1/verification-jobs', () => {
  it('未登录时拒绝读取任务列表', async () => {
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: null } }) },
    });

    const response = await GET(new Request('http://localhost/api/v1/verification-jobs?status=all'));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'UNAUTHORIZED', message: '请先登录' },
    });
  });

  it('已登录用户只能读取自己的任务概览', async () => {
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: 'user-id' } } }) },
      from: () => ({
        select: () => ({
          order: () => ({
            limit: async () => ({
              data: [{ id: 'job-id', status: 'queued', created_at: '2026-07-15T00:00:00.000Z' }],
              error: null,
            }),
          }),
        }),
      }),
    });

    const response = await GET(new Request('http://localhost/api/v1/verification-jobs?status=all'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      jobs: [{ id: 'job-id', status: 'queued', createdAt: '2026-07-15T00:00:00.000Z' }],
    });
  });

  it('status=active 仅查询进行中的任务状态', async () => {
    const inCalls: unknown[][] = [];
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: 'user-id' } } }) },
      from: () => ({
        select: () => ({
          in: (column: string, values: string[]) => {
            inCalls.push([column, values]);
            return {
              order: () => ({ limit: async () => ({ data: [], error: null }) }),
            };
          },
        }),
      }),
    });

    const response = await GET(
      new Request('http://localhost/api/v1/verification-jobs?status=active'),
    );

    expect(response.status).toBe(200);
    expect(inCalls).toEqual([
      ['status', ['queued', 'preparing', 'building', 'running', 'testing', 'reporting']],
    ]);
  });

  it('当前用户可通过有效 GitHub 安装创建 queued job', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: { id: 'github-job-id', status: 'queued' },
      error: null,
    });
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
      rpc,
    });
    listInstallationRepositories.mockResolvedValue([
      { id: 456, full_name: 'owner/private-repo', private: true, default_branch: 'main' },
    ]);

    const response = await POST(
      new Request('http://localhost/api/v1/verification-jobs', {
        method: 'POST',
        body: JSON.stringify({
          requestText: '验证首页',
          source: {
            type: 'github',
            installationId: 'installation-id',
            repositoryId: 456,
            ref: 'main',
          },
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      job: { id: 'github-job-id', status: 'queued' },
    });
    expect(rpc).toHaveBeenCalledWith('create_github_verification_job', {
      p_display_name: 'private-repo',
      p_installation_id: 'installation-id',
      p_prd_storage_path: null,
      p_repository_full_name: 'owner/private-repo',
      p_repository_id: 456,
      p_request_text: '验证首页',
      p_source_ref: 'main',
    });
  });
});
