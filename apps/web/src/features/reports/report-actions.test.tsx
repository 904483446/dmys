import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ReportActions } from './report-actions.js';

describe('ReportActions', () => {
  it('为完成报告提供可访问的导出和复制操作', () => {
    const html = renderToStaticMarkup(<ReportActions jobId="job-id" repairPrompt="修复保存逻辑" />);
    expect(html).toContain('复制修复提示词');
    expect(html).toContain('导出 Markdown');
    expect(html).toContain('导出 PDF');
    expect(html).toContain('重新验收');
  });
});
