import { ReportActions, RerunReportButton } from './report-actions';
import { ReportAutoRefresh } from './report-auto-refresh';
import { formatVerificationStatus } from '../jobs/format-verification-status';
import type { ReportComparison } from './report-comparison.js';
import {
  formatIssueSeverity,
  formatReportVerdict,
  formatVerificationItemStatus,
  type ReportDetail as Report,
} from './report-types';

type Props = { jobId: string; status: string; report: Report | null; errorMessage: string | null; comparison?: ReportComparison | null };

export function ReportDetail({ jobId, status, report, errorMessage, comparison = null }: Props) {
  if (report === null)
    return (
      <section className="demo report-pending" aria-live="polite">
        <strong>当前状态：{formatVerificationStatus(status)}</strong>
        <span>{errorMessage ?? '报告正在准备。'}</span>
        <ReportAutoRefresh jobId={jobId} status={status} />
        {(status === 'failed' || status === 'timed_out') && <RerunReportButton jobId={jobId} />}
      </section>
    );

  const verifiedItems = report.verifiedItems.filter((item) => item.status === 'verified');
  const unverifiedItems = report.verifiedItems.filter((item) => item.status === 'not_verified');
  const manualReviewItems = report.verifiedItems.filter((item) => item.status === 'manual_review');
  const renderEvidenceItems = (items: Report['verifiedItems']) => (
    <ul>{items.length === 0 ? <li><strong>无</strong></li> : items.map((item) => (
      <li key={`${item.status}-${item.title}`}>
        <strong>{item.title}</strong>
        <span className={`report-evidence-status-${item.status}`}>{formatVerificationItemStatus(item.status)}</span>
        <div className="report-evidence-trace">
          <p>原始需求：{item.sourceRequirement ?? '历史报告未保留原始需求'}</p>
          <p>执行结果：{item.detail ?? '历史报告未保留执行结果'}</p>
        </div>
      </li>
    ))}</ul>
  );

  return (
    <article className="report-detail">
      <section className="report-summary" aria-label="验收结论">
        <div className="report-metrics">
          <div><span>验收结论</span><strong>{formatReportVerdict(report.verdict)}</strong></div>
          <div><span>评分</span><strong>{report.score} / 100</strong></div>
          <div><span>可信度</span><strong>{report.confidence} / 100</strong></div>
        </div>
        <p className="report-summary-copy">{report.summary}</p>
        <span className="report-disclaimer">自动验收建议，最终由用户判断。</span>
      </section>
      <section className="report-section report-evidence report-evidence-panel" aria-labelledby="verification-items">
        <h2 id="verification-items">功能验收明细</h2>
        <h3>已验证（{verifiedItems.length}）</h3>
        {renderEvidenceItems(verifiedItems)}
        <h3>未验证（{unverifiedItems.length}）</h3>
        {renderEvidenceItems(unverifiedItems)}
        <h3>待人工补充（{manualReviewItems.length}）</h3>
        {renderEvidenceItems(manualReviewItems)}
      </section>
      <section className="report-section report-issues report-issues-panel" aria-labelledby="report-issues">
        <h2 id="report-issues">问题与修复提示词</h2>
        {report.issues.map((issue) => (
          <div className="report-issue" key={issue.title}>
            <div className="report-issue-heading"><h3>{issue.title}</h3><span>{formatIssueSeverity(issue.severity)}</span></div>
            <p>{issue.description}</p>
            <p>修复提示词：{issue.repairPrompt}</p>
            <ReportActions jobId={jobId} repairPrompt={issue.repairPrompt} />
          </div>
        ))}
      </section>
      {comparison !== null && (
        <section className="report-section report-comparison">
          <h2>与上次验收相比</h2>
          <p>评分变化：{comparison.scoreDelta}；问题数量变化：{comparison.issueCountDelta}</p>
          <p>新增问题：{comparison.newlyFound.join('、') || '无'}</p>
          <p>已解决问题：{comparison.resolved.join('、') || '无'}</p>
        </section>
      )}
    </article>
  );
}
