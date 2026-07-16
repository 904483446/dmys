import { describe, expect, it, vi } from 'vitest';

const { createSupabaseServerClient } = vi.hoisted(() => ({ createSupabaseServerClient: vi.fn() }));

vi.mock('../../../../../../lib/supabase/server-client.js', () => ({ createSupabaseServerClient }));

import * as rerunRoute from './route.js';

type RerunHandler = (
  request: Request,
  context: { params: Promise<{ jobId: string }> },
) => Promise<Response>;
const POST = (rerunRoute as { POST?: RerunHandler }).POST;

describe('POST /api/v1/verification-jobs/[jobId]/rerun', () => {
  it('拒绝重新验收当前用户不可见的任务', async () => {
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: 'user-id' } } }) },
      from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }),
      }),
    });

    const response = await POST?.(new Request('http://localhost', { method: 'POST' }), {
      params: Promise.resolve({ jobId: 'other-user-job' }),
    });

    expect(response?.status).toBe(404);
    await expect(response?.json()).resolves.toEqual({
      error: { code: 'JOB_NOT_FOUND', message: '未找到该验收任务' },
    });
  });

  it('为当前用户创建新的 queued 任务', async () => {
    const rpc = vi
      .fn()
      .mockResolvedValue({ data: { id: 'new-job-id', status: 'queued' }, error: null });
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: 'user-id' } } }) },
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: { id: 'old-job-id' } }) }),
        }),
      }),
      rpc,
    });

    const response = await POST?.(new Request('http://localhost', { method: 'POST', body: '{}' }), {
      params: Promise.resolve({ jobId: 'old-job-id' }),
    });

    expect(response?.status).toBe(200);
    await expect(response?.json()).resolves.toEqual({
      job: { id: 'new-job-id', status: 'queued' },
    });
    expect(rpc).toHaveBeenCalledWith('rerun_verification_job', {
      p_job_id: 'old-job-id',
      p_source_storage_path: null,
      p_source_ref: null,
    });
  });
});
