import { describe, expect, it, vi } from 'vitest';

import { runCommand } from './run-command.js';

describe('runCommand', () => {
  it('强制超时上限并截断输出', async () => {
    const run = vi.fn().mockResolvedValue({ exitCode: 0, output: 'abcdefgh' });
    const result = await runCommand(
      { run },
      { command: 'npm run build', timeoutMs: 999_999, maxOutputBytes: 4 },
    );

    expect(run).toHaveBeenCalledWith('npm run build', { timeoutMs: 600_000 });
    expect(result).toEqual({ exitCode: 0, output: 'abcd' });
  });
});
