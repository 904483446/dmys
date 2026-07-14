import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import LoginPage from './page.js';

describe('登录页', () => {
  it('提供邮箱 OTP 与 OAuth 登录入口说明', () => {
    const html = renderToStaticMarkup(<LoginPage />);

    expect(html).toContain('登录后开始验收');
    expect(html).toContain('邮箱验证码');
    expect(html).toContain('Google');
    expect(html).toContain('GitHub');
  });
});
