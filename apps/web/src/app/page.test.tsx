import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import HomePage from './page.js';

describe('首页', () => {
  it('展示固定演示报告和创建验收入口', () => {
    const html = renderToStaticMarkup(<HomePage />);

    expect(html).toContain('让 AI 生成的项目，');
    expect(html).toContain('可被真实验证。');
    expect(html).toContain('固定演示报告');
    expect(html).toContain('开始验收');
    expect(html).toContain('验收结论');
    expect(html).toContain('证据链');
    expect(html).toContain('开始验收');
    expect(html).toContain('home-hero');
    expect(html).toContain('home-preview');
    expect(html).toContain('home-evidence');
    expect(html).toContain('site-header');
    expect(html).toContain('landing-hero');
    expect(html).toContain('landing-product-preview');
    expect(html).toContain('href="/new"');
  });
});
