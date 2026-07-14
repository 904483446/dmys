import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ReportsEmptyState } from '../../features/reports/reports-empty-state.js';

describe('我的报告页', () => {
  it('在无报告时展示空状态和新建入口', async () => {
    const html = renderToStaticMarkup(<ReportsEmptyState />);

    expect(html).toContain('还没有验收报告');
    expect(html).toContain('新建验收');
  });
});
