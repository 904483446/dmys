import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { EmailOtpVerificationFields } from './email-otp-form.js';

describe('EmailOtpVerificationFields', () => {
  it('验证码输入框保持为空，且不提供更换邮箱按钮', () => {
    const html = renderToStaticMarkup(
      <EmailOtpVerificationFields
        message="验证码已发送。"
        onResend={() => undefined}
        onSubmit={() => undefined}
        onTokenChange={() => undefined}
        resendSeconds={60}
        token=""
      />,
    );

    expect(html).toContain('name="token"');
    expect(html).toContain('value=""');
    expect(html).not.toContain('更换邮箱');
    expect(html).toContain('60 秒后可重新发送');
    expect(html).toContain('disabled=""');
  });
});
