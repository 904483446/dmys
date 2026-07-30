import {
  formatIssueSeverity,
  formatReportVerdict,
  formatVerificationItemStatus,
  type ReportDetail,
} from './report-types.js';

export function renderReportMarkdown(report: ReportDetail): string {
  return [
    '# VibeVerify 验收报告',
    '',
    `结论：${formatReportVerdict(report.verdict)}`,
    `评分：${report.score} / 100`,
    `置信度：${report.confidence} / 100`,
    '',
    '## 已验证功能',
    ...report.verifiedItems.map((item) => `- ${item.title}：${formatVerificationItemStatus(item.status)}`),
    '',
    '## 问题与修复提示词',
    ...report.issues.flatMap((issue) => [
      `### ${issue.title}（${formatIssueSeverity(issue.severity)}）`,
      issue.description,
      `修复提示词：${issue.repairPrompt}`,
      '',
    ]),
    '自动验收建议，最终由用户判断。',
  ].join('\n');
}
