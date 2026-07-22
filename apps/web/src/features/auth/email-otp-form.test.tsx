import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { EmailMagicLinkRequestFields } from './email-otp-form.js';

describe('EmailMagicLinkRequestFields', () => {
  it('只渲染邮箱和发送登录链接按钮', () => {
    const html = renderToStaticMarkup(
      <EmailMagicLinkRequestFields
        email=""
        message="登录链接已发送。"
        onEmailChange={() => undefined}
        onSubmit={() => undefined}
      />,
    );

    expect(html).toContain('name="email"');
    expect(html).toContain('value=""');
    expect(html).toContain('发送登录链接');
    expect(html).not.toContain('name="token"');
    expect(html).not.toContain('重新发送验证码');
  });
});
