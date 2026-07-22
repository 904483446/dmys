import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ReportsEmptyState } from '../../features/reports/reports-empty-state.js';
import { ReportsWorkspaceHeading } from './page.js';

describe('我的报告页', () => {
  it('在无报告时展示空状态和新建入口', async () => {
    const html = renderToStaticMarkup(<ReportsEmptyState />);

    expect(html).toContain('还没有验收报告');
    expect(html).toContain('新建验收');
    expect(html).toContain('reports-empty');
    expect(html).toContain('reports-empty-action');
    expect(html).toContain('从一次验收开始');
  });

  it('以紧凑标题行提供新建验收入口', () => {
    const html = renderToStaticMarkup(<ReportsWorkspaceHeading />);

    expect(html).toContain('workspace-heading-row');
    expect(html).toContain('+ 新建验收');
    expect(html).toContain('href="/new"');
  });
});
