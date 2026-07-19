import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { AccessPageContent } from '../../features/access/access-page-content.js';

describe('内测激活页', () => {
  it('提示邀请测试并提供内测码输入框', () => {
    const html = renderToStaticMarkup(
      <AccessPageContent>
        <label>内测码</label>
        <button>激活访问权限</button>
      </AccessPageContent>,
    );

    expect(html).toContain('当前为邀请');
    expect(html).toContain('测试阶段');
    expect(html).toContain('内测码');
    expect(html).toContain('激活访问权限');
    expect(html).toContain('access-layout');
    expect(html).toContain('仅限受邀用户');
    expect(html).toContain('site-header');
    expect(html).toContain('auth-saas-layout');
    expect(html).toContain('auth-card');
    expect(html).toContain('auth-title-primary');
    expect(html).toContain('auth-title-secondary');
  });
});
