import { describe, expect, it, vi } from 'vitest';

import { createWorkerJobProcessor, processVerificationJob } from './process-verification-job.js';

describe('processVerificationJob', () => {
  it('identifies the failed install command without exposing command output', async () => {
    await expect(
      processVerificationJob(
        {
          createWorkspace: async () => 'temporary-workspace',
          removeWorkspace: vi.fn().mockResolvedValue(undefined),
          prepareSource: async () => ({
            projectDirectory: 'temporary-workspace',
            packageManager: 'pnpm',
            packageJson: {
              dependencies: { vite: '^6.0.0' },
              scripts: { build: 'vite build', dev: 'vite --host 0.0.0.0' },
            },
          }),
          run: async () => ({ exitCode: 1, output: 'private output must not be displayed' }),
          startProject: async () => ({ stop: async () => undefined }),
          collectBrowserEvidence: async () => ({ homepageReachable: true, evidenceIds: [] }),
          saveReport: vi.fn().mockResolvedValue(undefined),
          updateStatus: vi.fn().mockResolvedValue(undefined),
        },
        { id: 'job-id', sourceSnapshot: { sourceStoragePath: 'source.zip' }, request: '验证首页' },
      ),
    ).rejects.toThrow('PROJECT_COMMAND_FAILED:PNPM_INSTALL');
  });

  it('identifies a pnpm registry failure without exposing command output', async () => {
    await expect(
      processVerificationJob(
        {
          createWorkspace: async () => 'temporary-workspace',
          removeWorkspace: vi.fn().mockResolvedValue(undefined),
          prepareSource: async () => ({
            projectDirectory: 'temporary-workspace',
            packageManager: 'pnpm',
            packageJson: {
              dependencies: { vite: '^6.0.0' },
              scripts: { build: 'vite build', dev: 'vite --host 0.0.0.0' },
            },
          }),
          run: async () => ({ exitCode: 1, output: 'ERR_PNPM_META_FETCH_FAIL https://registry.npmjs.org/pnpm' }),
          startProject: async () => ({ stop: async () => undefined }),
          collectBrowserEvidence: async () => ({ homepageReachable: true, evidenceIds: [] }),
          saveReport: vi.fn().mockResolvedValue(undefined),
          updateStatus: vi.fn().mockResolvedValue(undefined),
        },
        { id: 'job-id', sourceSnapshot: { sourceStoragePath: 'source.zip' }, request: '验证首页' },
      ),
    ).rejects.toThrow('PROJECT_COMMAND_FAILED:PNPM_INSTALL:REGISTRY');
  });

  it('retries one transient pnpm registry failure before building the project', async () => {
    const run = vi
      .fn()
      .mockResolvedValueOnce({ exitCode: 1, output: 'ERR_PNPM_META_FETCH_FAIL https://registry.npmjs.org/pnpm' })
      .mockResolvedValueOnce({ exitCode: 0, output: 'installed' })
      .mockResolvedValueOnce({ exitCode: 0, output: 'built' });

    await processVerificationJob(
      {
        createWorkspace: async () => 'temporary-workspace',
        removeWorkspace: vi.fn().mockResolvedValue(undefined),
        prepareSource: async () => ({
          projectDirectory: 'temporary-workspace',
          packageManager: 'pnpm',
          packageJson: {
            dependencies: { vite: '^6.0.0' },
            scripts: { build: 'vite build', dev: 'vite --host 0.0.0.0' },
          },
        }),
        run,
        startProject: async () => ({ stop: async () => undefined }),
        collectBrowserEvidence: async () => ({ homepageReachable: true, evidenceIds: [] }),
        saveReport: vi.fn().mockResolvedValue(undefined),
        updateStatus: vi.fn().mockResolvedValue(undefined),
      },
      { id: 'job-id', sourceSnapshot: { sourceStoragePath: 'source.zip' }, request: '验证首页' },
    );

    expect(run.mock.calls.map((call) => call[1])).toEqual([
      'pnpm install --frozen-lockfile',
      'pnpm install --frozen-lockfile',
      'npm run build',
    ]);
  });

  it('将运行时的状态和报告回调组装到处理器', async () => {
    const updateStatus = vi.fn().mockResolvedValue(undefined);
    const saveReport = vi.fn().mockResolvedValue(undefined);
    const process = createWorkerJobProcessor({
      createWorkspace: async () => 'temporary-workspace',
      removeWorkspace: vi.fn().mockResolvedValue(undefined),
      prepareSource: async () => ({
        projectDirectory: 'temporary-workspace',
        packageJson: {
          dependencies: { vite: '^6.0.0' },
          scripts: { build: 'vite build', dev: 'vite --host 127.0.0.1' },
        },
      }),
      run: async () => ({ exitCode: 0, output: 'ok' }),
      startProject: async () => ({ stop: async () => undefined }),
      collectBrowserEvidence: async () => ({
        homepageReachable: true,
        evidenceIds: ['homepage-status'],
      }),
    });

    await process(
      { id: 'job-id', sourceSnapshot: { sourceStoragePath: 'source.zip' } },
      updateStatus,
      saveReport,
    );

    expect(updateStatus).toHaveBeenCalledWith('building');
    expect(saveReport).toHaveBeenCalledWith(expect.objectContaining({ verdict: 'at_risk' }));
  });

  it('对受支持的 Vite 项目按白名单命令处理并保存脱敏降级报告', async () => {
    const run = vi.fn().mockResolvedValue({ exitCode: 0, output: 'ok' });
    const saveReport = vi.fn().mockResolvedValue(undefined);
    const remove = vi.fn().mockResolvedValue(undefined);
    const updateStatus = vi.fn().mockResolvedValue(undefined);
    const stop = vi.fn().mockResolvedValue(undefined);
    const startProject = vi.fn().mockResolvedValue({ stop });

    const prepareSource = vi.fn().mockResolvedValue({
      projectDirectory: 'temporary-workspace',
      packageJson: {
        dependencies: { vite: '^6.0.0' },
        scripts: { build: 'vite build', dev: 'vite --host 0.0.0.0' },
      },
    });

    await processVerificationJob(
      {
        createWorkspace: async () => 'temporary-workspace',
        removeWorkspace: remove,
        prepareSource,
        run,
        startProject,
        collectBrowserEvidence: async () => ({
          homepageReachable: true,
          evidenceIds: ['homepage-status'],
        }),
        saveReport,
        updateStatus,
      },
      { id: 'job-id', sourceSnapshot: { sourceStoragePath: 'user-id/upload-id/source.zip' } },
    );

    expect(prepareSource).toHaveBeenCalledWith('temporary-workspace', {
      sourceStoragePath: 'user-id/upload-id/source.zip',
    });
    expect(run).toHaveBeenCalledWith('temporary-workspace', 'npm ci');
    expect(run).toHaveBeenCalledWith('temporary-workspace', 'npm run build');
    expect(startProject).toHaveBeenCalledWith(
      'temporary-workspace',
      'npm run dev',
      'http://127.0.0.1:5173',
    );
    expect(saveReport).toHaveBeenCalledWith(
      'job-id',
      expect.objectContaining({ verdict: 'at_risk', verifiedItems: expect.any(Array) }),
    );
    expect(updateStatus.mock.calls.map((call) => call[1])).toEqual([
      'building',
      'running',
      'testing',
      'reporting',
    ]);
    expect(remove).toHaveBeenCalledWith('temporary-workspace');
    expect(stop).toHaveBeenCalledOnce();
  });

  it('在归档识别出的项目根目录执行白名单命令', async () => {
    const run = vi.fn().mockResolvedValue({ exitCode: 0, output: 'ok' });

    await processVerificationJob(
      {
        createWorkspace: async () => 'temporary-workspace',
        removeWorkspace: vi.fn().mockResolvedValue(undefined),
        prepareSource: async () => ({
          projectDirectory: 'temporary-workspace\\generated-root',
          packageJson: {
            dependencies: { vite: '^6.0.0' },
            scripts: { build: 'vite build', dev: 'vite --host 0.0.0.0' },
          },
        }),
        run,
        startProject: async () => ({ stop: async () => undefined }),
        collectBrowserEvidence: async () => ({
          homepageReachable: true,
          evidenceIds: ['homepage-status'],
        }),
        saveReport: vi.fn().mockResolvedValue(undefined),
        updateStatus: vi.fn().mockResolvedValue(undefined),
      },
      { id: 'job-id', sourceSnapshot: { sourceStoragePath: 'source.zip' } },
    );

    expect(run).toHaveBeenCalledWith('temporary-workspace\\generated-root', 'npm ci');
  });
});
