import type { ReportDetail } from './report-types.js';

export function renderReportMarkdown(report: ReportDetail): string {
  return [
    '# VibeVerify 验收报告',
    '',
    `结论：${report.verdict}`,
    `评分：${report.score}`,
    `置信度：${report.confidence}`,
    '',
    '## 已验证功能',
    ...report.verifiedItems.map((item) => `- ${item.title}（${item.status}）`),
    '',
    '## 问题与修复提示词',
    ...report.issues.flatMap((issue) => [
      `### ${issue.title}`,
      issue.description,
      `修复提示词：${issue.repairPrompt}`,
      '',
    ]),
    '自动验收建议，最终由用户判断。',
  ].join('\n');
}
