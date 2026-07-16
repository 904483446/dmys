import { describe, expect, it, vi } from 'vitest';

const { createSupabaseServerClient } = vi.hoisted(() => ({ createSupabaseServerClient: vi.fn() }));

vi.mock('../../../../../lib/supabase/server-client.js', () => ({ createSupabaseServerClient }));

import { GET } from './route.js';

describe('GET /api/v1/verification-jobs/[jobId]', () => {
  it('拒绝访问当前用户不可见的任务', async () => {
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: 'user-id' } } }) },
      from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
      }),
    });

    const response = await GET(new Request('http://localhost'), {
      params: Promise.resolve({ jobId: 'other-user-job' }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'JOB_NOT_FOUND', message: '未找到该验收任务' },
    });
  });

  it('返回当前用户任务状态与已有报告摘要', async () => {
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: 'user-id' } } }) },
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: {
                id: 'job-id',
                status: 'completed',
                request_text: '验证首页',
                error_code: null,
                error_message: null,
                created_at: '2026-07-15T00:00:00.000Z',
                started_at: '2026-07-15T00:01:00.000Z',
                finished_at: '2026-07-15T00:02:00.000Z',
                verification_reports: {
                  verdict: 'passed',
                  score: 90,
                  confidence: 80,
                  summary: '通过',
                },
              },
              error: null,
            }),
          }),
        }),
      }),
    });

    const response = await GET(new Request('http://localhost'), {
      params: Promise.resolve({ jobId: 'job-id' }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      job: expect.objectContaining({ id: 'job-id', status: 'completed' }),
      report: { verdict: 'passed', score: 90, confidence: 80, summary: '通过' },
    });
  });
});
