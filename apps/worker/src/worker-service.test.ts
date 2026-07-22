import { describe, expect, it } from 'vitest';

import { runWorkerWithHealth } from './worker-service.js';

describe('runWorkerWithHealth', () => {
  it('在轮询结束后关闭健康服务', async () => {
    const events: string[] = [];

    await runWorkerWithHealth({
      startHealthServer: async () => {
        events.push('health-started');
        return { close: async () => events.push('health-closed') };
      },
      runWorkerLoop: async () => {
        events.push('loop-ran');
      },
    });

    expect(events).toEqual(['health-started', 'loop-ran', 'health-closed']);
  });
});
