import { describe, expect, it, vi } from 'vitest';

import { runWorkerOnce } from './run-worker.js';

describe('runWorkerOnce', () => {
  it('无可领取任务时返回 idle', async () => {
    const process = vi.fn();
    const result = await runWorkerOnce({ claim: async () => null, process, update: vi.fn() });

    expect(result).toEqual({ status: 'idle' });
    expect(process).not.toHaveBeenCalled();
  });

  it('处理器失败时写入 failed 状态', async () => {
    const update = vi.fn().mockResolvedValue(undefined);
    const log = vi.fn();
    const result = await runWorkerOnce({
      claim: async () => ({ id: 'job-id', sourceSnapshot: { sourceStoragePath: 'private/path' } }),
      process: async () => {
        throw new Error('执行失败');
      },
      update,
      log,
    });

    expect(result).toEqual({ status: 'failed', jobId: 'job-id' });
    expect(update).toHaveBeenCalledWith('job-id', 'failed', 'WORKER_PROCESS_FAILED', '执行失败');
    expect(log).toHaveBeenCalledWith({ event: 'verification_job_failed', code: 'WORKER_PROCESS_FAILED' });
  });

  it('writes completed status after successful processing', async () => {
    const update = vi.fn().mockResolvedValue(undefined);
    const result = await runWorkerOnce({
      claim: async () => ({ id: 'job-id', sourceSnapshot: { sourceStoragePath: 'private/path' } }),
      process: async () => undefined,
      update,
    });

    expect(result).toEqual({ status: 'processed', jobId: 'job-id' });
    expect(update).toHaveBeenCalledWith('job-id', 'completed', null, null);
  });
});
