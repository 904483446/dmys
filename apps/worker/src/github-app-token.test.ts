import { describe, expect, it, vi } from 'vitest';

import { createGitHubInstallationToken } from './github-app-token.js';

describe('createGitHubInstallationToken', () => {
  it('使用 App JWT 换取短期 installation token', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ token: 'temporary-token' }), { status: 201 }),
      );

    await expect(
      createGitHubInstallationToken({ fetch, createAppJwt: async () => 'app-jwt' }, 123),
    ).resolves.toBe('temporary-token');
    expect(fetch).toHaveBeenCalledWith(
      'https://api.github.com/app/installations/123/access_tokens',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer app-jwt' }),
      }),
    );
  });
});
