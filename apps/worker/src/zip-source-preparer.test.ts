import { describe, expect, it, vi } from 'vitest';

import { createZipSourcePreparer } from './zip-source-preparer.js';

describe('createZipSourcePreparer', () => {
  it('仅接受 ZIP 快照并将其交给安全项目准备链', async () => {
    const extract = vi.fn().mockResolvedValue(undefined);
    const prepareSource = createZipSourcePreparer({
      download: async () => Buffer.from('zip-content'),
      writeFile: vi.fn().mockResolvedValue(undefined),
      listEntries: async () => ['package.json'],
      extract,
      readFile: async () =>
        JSON.stringify({
          dependencies: { vite: '^6.0.0' },
          scripts: { build: 'vite build', dev: 'vite' },
        }),
    });

    await expect(
      prepareSource('temporary-workspace', { sourceStoragePath: 'user-id/upload-id/source.zip' }),
    ).resolves.toEqual({
      packageJson: {
        dependencies: { vite: '^6.0.0' },
        scripts: { build: 'vite build', dev: 'vite' },
      },
      projectDirectory: 'temporary-workspace',
      packageManager: 'npm',
    });
    expect(extract).toHaveBeenCalledTimes(1);
  });
});
