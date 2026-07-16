import { describe, expect, it, vi } from 'vitest';

import { createLocalProjectServer } from './local-project-server.js';

describe('createLocalProjectServer', () => {
  it('仅以无 shell 的 npm 白名单命令启动本地项目，并在停止时终止进程', async () => {
    const once = vi.fn((_event: 'exit', callback: () => void) => callback());
    const kill = vi.fn();
    const spawn = vi.fn().mockReturnValue({ kill, once });
    const waitForReady = vi.fn().mockResolvedValue(undefined);
    const server = createLocalProjectServer({ spawn, waitForReady });

    const running = await server.start('temporary-project', 'npm run dev', 'http://127.0.0.1:5173');
    await running.stop();

    expect(spawn).toHaveBeenCalledWith('npm', ['run', 'dev'], {
      cwd: 'temporary-project',
      shell: false,
      stdio: 'ignore',
    });
    expect(waitForReady).toHaveBeenCalledWith('http://127.0.0.1:5173');
    expect(kill).toHaveBeenCalledWith('SIGTERM');
  });

  it('拒绝不在白名单内的启动命令', async () => {
    const server = createLocalProjectServer({ spawn: vi.fn(), waitForReady: vi.fn() });

    await expect(
      server.start('temporary-project', 'npm run evil', 'http://127.0.0.1:5173'),
    ).rejects.toThrow('UNSAFE_COMMAND');
  });
});
