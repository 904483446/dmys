import { describe, expect, it, vi } from 'vitest';

import { createWorkerRuntime, createWorkerServiceClient } from './index.js';

describe('createWorkerRuntime', () => {
  it('将领取、处理和最终状态更新接入单次轮询', async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({
        data: { id: 'job-id', source_snapshot: { sourceStoragePath: 'private/path' } },
        error: null,
      })
      .mockResolvedValueOnce({ data: { id: 'job-id' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'job-id' }, error: null });
    const process = vi
      .fn()
      .mockImplementation(async (_job, updateStatus) => updateStatus('testing'));
    const runtime = createWorkerRuntime({ client: { rpc }, workerId: 'worker-a', process });

    await expect(runtime.runOnce()).resolves.toEqual({ status: 'processed', jobId: 'job-id' });
    expect(process).toHaveBeenCalledWith(
      { id: 'job-id', sourceSnapshot: { sourceStoragePath: 'private/path' } },
      expect.any(Function),
      expect.any(Function),
    );
    expect(rpc).toHaveBeenLastCalledWith('update_verification_job_for_worker', {
      p_job_id: 'job-id',
      p_worker_id: 'worker-a',
      p_status: 'completed',
      p_error_code: null,
      p_error_message: null,
    });
    expect(rpc).toHaveBeenNthCalledWith(2, 'update_verification_job_for_worker', {
      p_job_id: 'job-id',
      p_worker_id: 'worker-a',
      p_status: 'testing',
      p_error_code: null,
      p_error_message: null,
    });
  });
});

describe('createWorkerServiceClient', () => {
  it('使用禁用会话持久化的 service-role 客户端配置', () => {
    const client = { rpc: vi.fn() };
    const createClient = vi.fn().mockReturnValue(client);

    expect(
      createWorkerServiceClient(
        { url: 'https://supabase.example.test', serviceRoleKey: 'configured-value' },
        createClient,
      ),
    ).toBe(client);
    expect(createClient).toHaveBeenCalledWith('https://supabase.example.test', 'configured-value', {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  });
});
