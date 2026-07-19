import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { SiteHeader } from './site-header.js';

describe('SiteHeader', () => {
  it('提供登录入口和新建验收入口', () => {
    const html = renderToStaticMarkup(<SiteHeader />);

    expect(html).toContain('site-header');
    expect(html).toContain('href="/login"');
    expect(html).toContain('href="/new"');
    expect(html).toContain('开始验收');
  });
});
