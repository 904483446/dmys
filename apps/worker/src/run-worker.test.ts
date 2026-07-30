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
    expect(update).toHaveBeenCalledWith('job-id', 'failed', 'WORKER_PROCESS_FAILED', 'WORKER_PROCESS_FAILED');
    expect(log).toHaveBeenCalledWith({ event: 'verification_job_failed', code: 'WORKER_PROCESS_FAILED' });
  });

  it('preserves safe RPC failure codes when writing a failed status', async () => {
    const update = vi.fn().mockResolvedValue(undefined);
    const log = vi.fn();

    const result = await runWorkerOnce({
      claim: async () => ({ id: 'job-id', sourceSnapshot: {} }),
      process: async () => { throw new Error('WORKER_RPC_FAILED:EMPTY_RESPONSE'); },
      update,
      log,
    });

    expect(result).toEqual({ status: 'failed', jobId: 'job-id' });
    expect(update).toHaveBeenCalledWith(
      'job-id',
      'failed',
      'WORKER_RPC_FAILED:EMPTY_RESPONSE',
      'WORKER_RPC_FAILED:EMPTY_RESPONSE',
    );
    expect(log).toHaveBeenCalledWith({ event: 'verification_job_failed', code: 'WORKER_RPC_FAILED:EMPTY_RESPONSE' });
  });

  it('preserves safe report model failure codes when writing a failed status', async () => {
    const update = vi.fn().mockResolvedValue(undefined);

    await runWorkerOnce({
      claim: async () => ({ id: 'job-id', sourceSnapshot: {} }),
      process: async () => { throw new Error('REPORT_MODEL_FAILED:RATE_LIMITED'); },
      update,
    });

    expect(update).toHaveBeenCalledWith(
      'job-id',
      'failed',
      'REPORT_MODEL_FAILED:RATE_LIMITED',
      'REPORT_MODEL_FAILED:RATE_LIMITED',
    );
  });

  it('失败状态无法回写时记录独立的安全错误码', async () => {
    const log = vi.fn();
    const update = vi.fn().mockRejectedValue(new Error('WORKER_RPC_FAILED:EMPTY_RESPONSE'));

    await expect(
      runWorkerOnce({
        claim: async () => ({ id: 'job-id', sourceSnapshot: {} }),
        process: async () => { throw new Error('UNSUPPORTED_PROJECT'); },
        update,
        log,
      }),
    ).resolves.toEqual({ status: 'failed', jobId: 'job-id' });
    expect(log).toHaveBeenCalledWith({ event: 'verification_job_failure_persist_failed', code: 'WORKER_RPC_FAILED:EMPTY_RESPONSE' });
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
