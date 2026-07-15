import { describe, expect, it, vi } from 'vitest';

import { completeInstallation } from './complete-installation.js';

describe('completeInstallation', () => {
  it('验证 state 后以当前用户归属写入安装摘要', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const result = await completeInstallation({
      state: 'state',
      userId: 'user-a',
      installationId: 123,
      accountLogin: 'account',
      verifyState: () => ({ ok: true as const }),
      upsert,
    });
    expect(result).toEqual({ ok: true });
    expect(upsert).toHaveBeenCalledWith({
      userId: 'user-a',
      installationId: 123,
      accountLogin: 'account',
    });
  });
});
