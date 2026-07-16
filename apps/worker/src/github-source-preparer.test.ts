import { describe, expect, it, vi } from 'vitest';

import { createGitHubSourcePreparer } from './github-source-preparer.js';

describe('createGitHubSourcePreparer', () => {
  it('解析安装记录后下载归档并复用安全 ZIP 准备链', async () => {
    const downloadArchive = vi.fn().mockResolvedValue(Buffer.from('archive'));
    const prepareSource = createGitHubSourcePreparer({
      resolveInstallationId: async () => 123,
      downloadArchive,
      writeFile: vi.fn().mockResolvedValue(undefined),
      listEntries: async () => ['generated-root/package.json'],
      extract: vi.fn().mockResolvedValue(undefined),
      readFile: async () =>
        JSON.stringify({
          dependencies: { vite: '^6.0.0' },
          scripts: { build: 'vite build', dev: 'vite' },
        }),
    });

    await expect(
      prepareSource('temporary-workspace', {
        installationId: 'installation-record-id',
        repositoryId: 456,
        ref: 'main',
      }),
    ).resolves.toEqual(
      expect.objectContaining({ projectDirectory: 'temporary-workspace\\generated-root' }),
    );
    expect(downloadArchive).toHaveBeenCalledWith({
      installationId: 123,
      repositoryId: 456,
      ref: 'main',
    });
  });
});
