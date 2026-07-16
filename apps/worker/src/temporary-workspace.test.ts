import { describe, expect, it, vi } from 'vitest';

import { withTemporaryWorkspace } from './temporary-workspace.js';

describe('withTemporaryWorkspace', () => {
  it('处理器抛错后仍清理临时目录', async () => {
    const remove = vi.fn().mockResolvedValue(undefined);

    await expect(
      withTemporaryWorkspace({ create: async () => 'C:/tmp/job', remove }, async () => {
        throw new Error('failed');
      }),
    ).rejects.toThrow('failed');

    expect(remove).toHaveBeenCalledWith('C:/tmp/job');
  });
});
