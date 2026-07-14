import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import HomePage from './page.js';

describe('首页', () => {
  it('展示固定演示报告和创建验收入口', () => {
    const html = renderToStaticMarkup(<HomePage />);

    expect(html).toContain('让 AI 生成的项目，');
    expect(html).toContain('可被真实验证。');
    expect(html).toContain('固定演示报告');
    expect(html).toContain('新建验收');
  });
});
