import { describe, expect, it, vi } from 'vitest';

import { resolveGitHubInstallationId } from './github-installation-resolver.js';

describe('resolveGitHubInstallationId', () => {
  it('只解析当前未撤销安装记录的 GitHub 数值 installation ID', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { installation_id: 123 }, error: null });
    const is = vi.fn().mockReturnValue({ maybeSingle });
    const eq = vi.fn().mockReturnValue({ is });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });

    await expect(resolveGitHubInstallationId({ from }, 'installation-record-id')).resolves.toBe(
      123,
    );
    expect(from).toHaveBeenCalledWith('github_installations');
    expect(is).toHaveBeenCalledWith('revoked_at', null);
  });
});
