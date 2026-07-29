import { describe, expect, it, vi } from 'vitest';

import { runWorkerLoop } from './worker-loop.js';

describe('runWorkerLoop', () => {
  it('空闲时等待后再轮询，直到收到停止信号', async () => {
    const runOnce = vi.fn().mockResolvedValue({ status: 'idle' });
    const sleep = vi.fn().mockResolvedValue(undefined);
    const shouldContinue = vi.fn().mockReturnValueOnce(true).mockReturnValueOnce(false);

    await runWorkerLoop({ runOnce, sleep, shouldContinue, idleDelayMs: 5_000 });

    expect(runOnce).toHaveBeenCalledTimes(1);
    expect(sleep).toHaveBeenCalledWith(5_000);
  });

  it('任务失败后也等待，避免连续失败时紧密循环', async () => {
    const runOnce = vi.fn().mockResolvedValue({ status: 'failed' });
    const sleep = vi.fn().mockResolvedValue(undefined);
    const shouldContinue = vi.fn().mockReturnValueOnce(true).mockReturnValueOnce(false);

    await runWorkerLoop({ runOnce, sleep, shouldContinue, idleDelayMs: 5_000 });

    expect(sleep).toHaveBeenCalledWith(5_000);
  });
});
