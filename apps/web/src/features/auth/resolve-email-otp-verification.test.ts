import { describe, expect, it } from 'vitest';

import { resolveEmailOtpVerification } from './resolve-email-otp-verification.js';

describe('resolveEmailOtpVerification', () => {
  it('优先返回 SSR 回调中的授权码', () => {
    expect(
      resolveEmailOtpVerification(new URL('https://app.example.test/auth/confirm?code=auth-code')),
    ).toEqual({ kind: 'code', code: 'auth-code' });
  });

  it('接受 Supabase 邮件链接使用的 token 参数', () => {
    expect(
      resolveEmailOtpVerification(
        new URL('https://app.example.test/auth/confirm?token=mail-token&type=magiclink'),
      ),
    ).toEqual({ kind: 'otp', tokenHash: 'mail-token', type: 'magiclink' });
  });
});
