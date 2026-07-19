import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import LoginPage from './page.js';

describe('登录页', () => {
  it('提供邮箱 OTP 与 OAuth 登录入口说明', () => {
    const html = renderToStaticMarkup(<LoginPage />);

    expect(html).toContain('登录后开始');
    expect(html).toContain('验收');
    expect(html).toContain('邮箱验证码');
    expect(html).toContain('Google');
    expect(html).toContain('GitHub');
    expect(html).toContain('login-layout');
    expect(html).toContain('安全登录');
    expect(html).toContain('site-header');
    expect(html).toContain('auth-saas-layout');
    expect(html).toContain('auth-card');
    expect(html).toContain('auth-title-primary');
    expect(html).toContain('auth-title-secondary');
  });
});
