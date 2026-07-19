import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { AppShell } from './app-shell.js';

describe('AppShell', () => {
  it('提供工作台侧栏和页面标题', () => {
    const html = renderToStaticMarkup(<AppShell title="我的报告">内容</AppShell>);

    expect(html).toContain('app-shell');
    expect(html).toContain('app-sidebar');
    expect(html).toContain('我的报告');
    expect(html).toContain('href="/reports"');
    expect(html).toContain('href="/new"');
  });
});
