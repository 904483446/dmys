import { describe, expect, it } from 'vitest';

import { decideAccessActivation } from './decide-access-activation.js';

describe('decideAccessActivation', () => {
  it('为未登录、未配置和无效内测码返回稳定中文错误码', () => {
    expect(decideAccessActivation({ userId: null, isCodeValid: true })).toEqual({
      ok: false,
      code: 'UNAUTHORIZED',
      message: '请先登录后再验证内测码',
    });
    expect(decideAccessActivation({ userId: 'user-1', isCodeValid: false })).toEqual({
      ok: false,
      code: 'INVALID_BETA_ACCESS_CODE',
      message: '内测码无效或已失效',
    });
    expect(decideAccessActivation({ userId: 'user-1', isCodeValid: true })).toEqual({ ok: true });
  });
});
