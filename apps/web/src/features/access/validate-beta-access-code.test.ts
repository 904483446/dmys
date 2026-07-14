import { describe, expect, it } from 'vitest';

import { validateBetaAccessCode } from './validate-beta-access-code.js';

describe('validateBetaAccessCode', () => {
  it('只在服务端配置的内测码完全匹配时激活访问权限', () => {
    expect(validateBetaAccessCode(' invite-2026 ', 'invite-2026')).toBe(true);
    expect(validateBetaAccessCode('wrong', 'invite-2026')).toBe(false);
    expect(validateBetaAccessCode('invite-2026', undefined)).toBe(false);
  });
});
