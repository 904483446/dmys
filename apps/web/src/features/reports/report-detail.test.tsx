import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ReportDetail } from './report-detail.js';

const report = {
  verdict: 'at_risk' as const,
  score: 64,
  confidence: 70,
  summary: '存在风险',
  verifiedItems: [{ title: '首页可访问', evidenceIds: ['homepage-ok'], status: 'verified' as const }],
  issues: [{ severity: 'major' as const, title: '保存失败', description: '提交后未更新', evidenceIds: ['console-1'], repairPrompt: '修复保存逻辑' }],
};

describe('ReportDetail', () => {
  it('按结论、证据、问题顺序展示报告', () => {
    const html = renderToStaticMarkup(<ReportDetail status="completed" report={report} errorMessage={null} />);
    expect(html.indexOf('自动验收建议')).toBeLessThan(html.indexOf('已验证功能'));
    expect(html.indexOf('已验证功能')).toBeLessThan(html.indexOf('问题与修复提示词'));
  });

  it('为失败任务提供可行动说明', () => {
    const html = renderToStaticMarkup(<ReportDetail status="failed" report={null} errorMessage="构建失败" />);
    expect(html).toContain('构建失败');
    expect(html).toContain('重新验收');
  });
});
