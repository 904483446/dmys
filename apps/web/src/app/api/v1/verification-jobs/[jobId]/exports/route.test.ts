import { describe, expect, it, vi } from 'vitest';

const { createSupabaseServerClient } = vi.hoisted(() => ({ createSupabaseServerClient: vi.fn() }));

vi.mock('../../../../../../lib/supabase/server-client.js', () => ({ createSupabaseServerClient }));

import { POST } from './route.js';

describe('POST /api/v1/verification-jobs/[jobId]/exports', () => {
  it('拒绝导出未完成任务', async () => {
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: 'user-id' } } }) },
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: { id: 'job-id', status: 'running' }, error: null }),
          }),
        }),
      }),
    });

    const response = await POST(
      new Request('http://localhost', { method: 'POST', body: JSON.stringify({ format: 'markdown' }) }),
      { params: Promise.resolve({ jobId: 'job-id' }) },
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'JOB_NOT_COMPLETED', message: '验收尚未完成，暂不能导出' },
    });
  });
});
