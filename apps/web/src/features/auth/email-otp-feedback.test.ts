import { describe, expect, it } from 'vitest';

import { OTP_RESEND_COOLDOWN_SECONDS, getOtpSendErrorMessage } from './email-otp-feedback.js';

describe('email OTP feedback', () => {
  it('将重发倒计时固定为一分钟', () => {
    expect(OTP_RESEND_COOLDOWN_SECONDS).toBe(60);
  });

  it('将 Supabase 的限流错误转为明确提示', () => {
    expect(getOtpSendErrorMessage({ status: 429, message: 'Email rate limit exceeded' })).toBe(
      '发送受限：当前测试环境每小时最多发送 2 封邮件，请稍后再试。',
    );
  });
});
