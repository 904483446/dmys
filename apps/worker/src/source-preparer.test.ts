import { describe, expect, it, vi } from 'vitest';

import { createSourcePreparer } from './source-preparer.js';

describe('createSourcePreparer', () => {
  it('按任务来源路由到 ZIP 或 GitHub 准备器', async () => {
    const zip = vi.fn().mockResolvedValue({ packageJson: {}, projectDirectory: 'zip-root' });
    const github = vi.fn().mockResolvedValue({ packageJson: {}, projectDirectory: 'github-root' });
    const prepareSource = createSourcePreparer({ zip, github });

    await expect(prepareSource('workspace', { sourceStoragePath: 'source.zip' })).resolves.toEqual(
      expect.objectContaining({ projectDirectory: 'zip-root' }),
    );
    await expect(
      prepareSource('workspace', { installationId: 'installation', repositoryId: 1, ref: 'main' }),
    ).resolves.toEqual(expect.objectContaining({ projectDirectory: 'github-root' }));
    expect(zip).toHaveBeenCalledTimes(1);
    expect(github).toHaveBeenCalledTimes(1);
  });
});
