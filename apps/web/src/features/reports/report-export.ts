import {
  formatIssueSeverity,
  formatReportVerdict,
  formatVerificationItemStatus,
  type ReportDetail,
} from './report-types';

export function renderReportMarkdown(report: ReportDetail): string {
  const verifiedItems = report.verifiedItems.filter((item) => item.status === 'verified');
  const unverifiedItems = report.verifiedItems.filter((item) => item.status === 'not_verified');
  return [
    '# VibeVerify 验收报告',
    '',
    `结论：${formatReportVerdict(report.verdict)}`,
    `评分：${report.score} / 100`,
    `置信度：${report.confidence} / 100`,
    '',
    '## 功能验收明细',
    `### 已验证（${verifiedItems.length}）`,
    ...(verifiedItems.length === 0 ? ['- 无'] : verifiedItems.map((item) => `- ${item.title}：${formatVerificationItemStatus(item.status)}`)),
    `### 未验证（${unverifiedItems.length}）`,
    ...(unverifiedItems.length === 0 ? ['- 无'] : unverifiedItems.map((item) => `- ${item.title}：${formatVerificationItemStatus(item.status)}`)),
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
