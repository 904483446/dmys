import { describe, expect, it, vi } from 'vitest';

import { downloadGitHubSourceArchive } from './github-source-archive.js';

describe('downloadGitHubSourceArchive', () => {
  it('用短期 installation token 下载指定仓库和 ref 的归档，但不返回 token', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('archive', { status: 200 }));
    const result = await downloadGitHubSourceArchive(
      {
        createInstallationToken: async () => 'temporary-token',
        fetch,
      },
      { installationId: 'installation-id', repositoryId: 123, ref: 'main' },
    );

    expect(result).toEqual(Buffer.from('archive'));
    expect(fetch).toHaveBeenCalledWith(
      'https://api.github.com/repositories/123/zipball/main',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer temporary-token' }),
      }),
    );
    expect(JSON.stringify(result)).not.toContain('temporary-token');
  });
});
