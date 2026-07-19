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
    expect(html).toContain('开始验收');
    expect(html).toContain('home-hero');
    expect(html).toContain('home-preview');
    expect(html).toContain('home-evidence');
    expect(html).toContain('site-header');
    expect(html).toContain('landing-hero');
    expect(html).toContain('landing-product-preview');
    expect(html).toContain('landing-title-primary');
    expect(html).toContain('landing-title-accent');
    expect(html).not.toContain('不是“看起来完成”');
    expect(html).toContain('目标与验收标准');
    expect(html).toContain('浏览器与运行证据');
    expect(html).toContain('可执行的修复建议');
    expect(html).toContain('href="/#evidence"');
    expect(html).toContain('href="/new"');
  });
});
