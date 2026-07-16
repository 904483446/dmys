import { describe, expect, it, vi } from 'vitest';

import { createNodeCommandRunner } from './node-command-runner.js';

describe('createNodeCommandRunner', () => {
  it('以非 shell 方式运行白名单 npm 命令', async () => {
    const execFile = vi.fn().mockResolvedValue({ stdout: 'ok', stderr: '' });
    const run = createNodeCommandRunner({ execFile });

    await expect(run('workspace', 'npm run build')).resolves.toEqual({ exitCode: 0, output: 'ok' });
    expect(execFile).toHaveBeenCalledWith('npm', ['run', 'build'], {
      cwd: 'workspace',
      timeout: 600_000,
      maxBuffer: 1_048_576,
      shell: false,
    });
  });

  it('拒绝不在白名单内的命令', async () => {
    const run = createNodeCommandRunner({ execFile: vi.fn() });

    await expect(run('workspace', 'npm run arbitrary')).rejects.toThrow('UNSAFE_COMMAND');
  });

  it('将非零退出码转换为受限输出摘要', async () => {
    const error = Object.assign(new Error('failed'), {
      code: 2,
      stdout: 'build output',
      stderr: 'build error',
    });
    const run = createNodeCommandRunner({ execFile: vi.fn().mockRejectedValue(error) });

    await expect(run('workspace', 'npm run build')).resolves.toEqual({
      exitCode: 2,
      output: 'build outputbuild error',
    });
  });
});
