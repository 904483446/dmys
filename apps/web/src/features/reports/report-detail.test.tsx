import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
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
  it('keeps report panels top-aligned and allows long list content to wrap', () => {
    const css = readFileSync(new URL('../../app/styles.css', import.meta.url), 'utf8');

    expect(css).toMatch(/\.report-detail\s*\{[^}]*align-items:\s*start/);
    expect(css).toMatch(/\.report-evidence-panel,\s*\.report-issues-panel,\s*\.report-comparison\s*\{[^}]*align-self:\s*start/);
    expect(css).toMatch(/\.report-evidence-panel li strong\s*\{[^}]*min-width:\s*0[^}]*overflow-wrap:\s*anywhere/);
    expect(css).toMatch(/\.report-evidence-panel li span,\s*\.report-issue-heading span\s*\{[^}]*flex-shrink:\s*0/);
  });

  it('gives each evidence status an independent column beside a wrapping title', () => {
    const css = readFileSync(new URL('../../app/styles.css', import.meta.url), 'utf8');

    expect(css).toMatch(/\.report-evidence-panel li\s*\{[^}]*display:\s*grid[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto[^}]*align-items:\s*start/);
  });

  it('uses Chinese labels and 100-point metrics instead of internal enum values', () => {
    const html = renderToStaticMarkup(<ReportDetail jobId="job-id" status="completed" report={report} errorMessage={null} />);

    expect(html).toContain('有风险');
    expect(html).toContain('64 / 100');
    expect(html).toContain('70 / 100');
    expect(html).toContain('已验证');
    expect(html).toContain('重要');
    expect(html).not.toContain('>at_risk<');
    expect(html).not.toContain('>verified<');
    expect(html).not.toContain('>major<');
  });

  it('keeps horizontal padding on evidence and issue panels', () => {
    const css = readFileSync(new URL('../../app/styles.css', import.meta.url), 'utf8');

    expect(css).not.toMatch(/\.report-evidence,\s*\.report-issues\s*\{[^}]*padding:\s*1\.5rem\s+0/);
  });

  it('separates verified and unverified checks instead of labelling one mixed list as verified', () => {
    const mixedReport = {
      ...report,
      verifiedItems: [
        report.verifiedItems[0]!,
        { title: '添加任务', evidenceIds: [], status: 'not_verified' as const },
      ],
    };

    const html = renderToStaticMarkup(<ReportDetail jobId="job-id" status="completed" report={mixedReport} errorMessage={null} />);

    expect(html).toContain('功能验收明细');
    expect(html).toContain('已验证（1）');
    expect(html).toContain('未验证（1）');
    expect(html).not.toContain('<h2 id="verified-items">已验证功能</h2>');
  });

  it('按结论、证据、问题顺序展示报告', () => {
    const html = renderToStaticMarkup(<ReportDetail jobId="job-id" status="completed" report={report} errorMessage={null} />);
    expect(html.indexOf('自动验收建议')).toBeLessThan(html.indexOf('功能验收明细'));
    expect(html.indexOf('功能验收明细')).toBeLessThan(html.indexOf('问题与修复提示词'));
    expect(html).toContain('report-summary');
    expect(html).toContain('report-issues');
    expect(html).toContain('report-metrics');
    expect(html).toContain('report-evidence-panel');
    expect(html).toContain('report-issues-panel');
  });

  it('展示同项目历史对比摘要', () => {
    const html = renderToStaticMarkup(<ReportDetail jobId="job-id" status="completed" report={report} errorMessage={null} comparison={{ scoreDelta: 10, issueCountDelta: -1, newlyFound: ['搜索失败'], resolved: ['保存失败'] }} />);
    expect(html).toContain('与上次验收相比');
    expect(html).toContain('搜索失败');
    expect(html).toContain('保存失败');
  });

  it('为失败任务提供可行动说明', () => {
    const html = renderToStaticMarkup(<ReportDetail jobId="job-id" status="failed" report={null} errorMessage="构建失败" />);
    expect(html).toContain('构建失败');
    expect(html).toContain('重新验收');
  });

  it.each(['failed', 'timed_out'])('仅在无报告的 %s 状态展示重新验收按钮', (status) => {
    const html = renderToStaticMarkup(<ReportDetail jobId="job-id" status={status} report={null} errorMessage={null} />);

    expect(html).toContain('重新验收');
  });

  it('不在有报告或非失败状态展示重新验收按钮', () => {
    const completedHtml = renderToStaticMarkup(<ReportDetail jobId="job-id" status="completed" report={report} errorMessage={null} />);
    const buildingHtml = renderToStaticMarkup(<ReportDetail jobId="job-id" status="building" report={null} errorMessage={null} />);

    expect(completedHtml).not.toContain('重新验收');
    expect(buildingHtml).not.toContain('重新验收');
  });

  it('在处理中提示用户页面会自动刷新', () => {
    const html = renderToStaticMarkup(<ReportDetail jobId="job-id" status="building" report={null} errorMessage={null} />);

    expect(html).toContain('正在构建');
    expect(html).not.toContain('>building<');
    expect(html).toContain('页面会自动刷新');
  });
});
