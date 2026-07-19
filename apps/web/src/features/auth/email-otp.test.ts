import { describe, expect, it, vi } from 'vitest';

import { requestEmailOtp, verifyEmailOtp } from './email-otp.js';

describe('email OTP', () => {
  it('发送验证码时不携带登录链接跳转地址', async () => {
    const signInWithOtp = vi.fn().mockResolvedValue({ error: null });

    await requestEmailOtp({ email: 'user@example.com', auth: { signInWithOtp } });

    expect(signInWithOtp).toHaveBeenCalledWith({ email: 'user@example.com' });
  });

  it('使用邮箱和六位数字验证码向 Supabase 验证登录', async () => {
    const verifyOtp = vi.fn().mockResolvedValue({ error: null });

    await verifyEmailOtp({ email: 'user@example.com', token: '123456', auth: { verifyOtp } });

    expect(verifyOtp).toHaveBeenCalledWith({
      email: 'user@example.com',
      token: '123456',
      type: 'email',
    });
  });
});
