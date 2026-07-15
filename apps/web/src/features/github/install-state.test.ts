import { describe, expect, it } from 'vitest';

import { consumeInstallState, createInstallState, decodeInstallState } from './install-state.js';

describe('consumeInstallState', () => {
  it('拒绝过期或不属于当前用户的安装 state', () => {
    expect(
      consumeInstallState({ userId: 'user-a', expiresAt: 100, now: 101, expectedUserId: 'user-a' }),
    ).toMatchObject({ ok: false, code: 'INVALID_GITHUB_INSTALLATION_STATE' });
    expect(
      consumeInstallState({ userId: 'user-a', expiresAt: 200, now: 100, expectedUserId: 'user-b' }),
    ).toMatchObject({ ok: false, code: 'INVALID_GITHUB_INSTALLATION_STATE' });
  });

  it('拒绝被篡改的已签名 state', () => {
    const state = createInstallState({
      userId: 'user-a',
      now: 100,
      secret: 'test-secret',
      nonce: 'nonce',
    });
    expect(
      decodeInstallState({
        state: `${state}x`,
        now: 101,
        secret: 'test-secret',
        expectedUserId: 'user-a',
      }),
    ).toMatchObject({ ok: false, code: 'INVALID_GITHUB_INSTALLATION_STATE' });
  });
});
