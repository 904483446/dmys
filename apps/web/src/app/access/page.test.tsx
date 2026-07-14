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

    expect(html).toContain('当前为邀请测试阶段');
    expect(html).toContain('内测码');
    expect(html).toContain('激活访问权限');
  });
});
