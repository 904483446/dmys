import {
  formatIssueSeverity,
  formatReportVerdict,
  formatVerificationItemStatus,
  type ReportDetail,
} from './report-types';

export function renderReportMarkdown(report: ReportDetail): string {
  const verifiedItems = report.verifiedItems.filter((item) => item.status === 'verified');
  const unverifiedItems = report.verifiedItems.filter((item) => item.status === 'not_verified');
  const manualReviewItems = report.verifiedItems.filter((item) => item.status === 'manual_review');
  const renderItems = (items: ReportDetail['verifiedItems']) =>
    items.length === 0
      ? ['- 无']
      : items.flatMap((item) => [
          `- ${item.title}：${formatVerificationItemStatus(item.status)}`,
          `  - 原始需求：${item.sourceRequirement ?? '历史报告未保留原始需求'}`,
          `  - 执行结果：${item.detail ?? '历史报告未保留执行结果'}`,
        ]);
  return [
    '# VibeVerify 验收报告',
    '',
    `结论：${formatReportVerdict(report.verdict)}`,
    `评分：${report.score} / 100`,
    `置信度：${report.confidence} / 100`,
    '',
    '## 功能验收明细',
    `### 已验证（${verifiedItems.length}）`,
    ...renderItems(verifiedItems),
    `### 未验证（${unverifiedItems.length}）`,
    ...renderItems(unverifiedItems),
    `### 待人工补充（${manualReviewItems.length}）`,
    ...renderItems(manualReviewItems),
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
