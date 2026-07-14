import { describe, expect, it } from 'vitest';

import { createOtpRedirectUrl } from './otp-redirect-url.js';

describe('createOtpRedirectUrl', () => {
  it('将 OTP 回调限制在本站 auth/confirm 路径', () => {
    expect(createOtpRedirectUrl('https://app.example.test/')).toBe(
      'https://app.example.test/auth/confirm',
    );
  });
});
