import { describe, expect, it } from 'vitest';

import { getOtpSendErrorMessage } from './email-otp-feedback.js';

describe('email magic link feedback', () => {
  it('将 Supabase 的限流错误转为明确提示', () => {
    expect(getOtpSendErrorMessage({ status: 429, message: 'Email rate limit exceeded' })).toBe(
      '发送受限：当前测试环境每小时最多发送 2 封邮件，请稍后再试。',
    );
  });

  it('将其他发送错误说明为登录链接发送失败', () => {
    expect(getOtpSendErrorMessage(new Error('network failed'))).toBe(
      '暂时无法发送登录链接，请稍后重试。',
    );
  });
});
