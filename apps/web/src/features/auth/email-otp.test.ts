import { describe, expect, it, vi } from 'vitest';

import { requestEmailOtp } from './email-otp.js';

describe('email magic link', () => {
  it('发送登录链接时携带当前站点的确认回跳地址', async () => {
    const signInWithOtp = vi.fn().mockResolvedValue({ error: null });

    await requestEmailOtp({
      email: 'user@example.com',
      redirectTo: 'https://preview.example.com/auth/confirm',
      auth: { signInWithOtp },
    });

    expect(signInWithOtp).toHaveBeenCalledWith({
      email: 'user@example.com',
      options: { emailRedirectTo: 'https://preview.example.com/auth/confirm' },
    });
  });
});
