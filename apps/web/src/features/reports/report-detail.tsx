import { ReportActions } from './report-actions';
import { ReportAutoRefresh } from './report-auto-refresh';
import type { ReportComparison } from './report-comparison.js';
import type { ReportDetail as Report } from './report-types.js';

type Props = { jobId: string; status: string; report: Report | null; errorMessage: string | null; comparison?: ReportComparison | null };

export function ReportDetail({ jobId, status, report, errorMessage, comparison = null }: Props) {
  if (report === null)
    return (
      <section className="demo report-pending" aria-live="polite">
        <strong>当前状态：{status}</strong>
        <span>{errorMessage ?? '报告正在准备。'}</span>
        <ReportAutoRefresh jobId={jobId} status={status} />
        {(status === 'failed' || status === 'timed_out') && <button type="button">重新验收</button>}
      </section>
    );

  return (
    <article className="report-detail">
      <section className="report-summary" aria-label="验收结论">
        <div className="report-metrics">
          <div><span>验收结论</span><strong>{report.verdict}</strong></div>
          <div><span>评分</span><strong>{report.score}</strong></div>
          <div><span>可信度</span><strong>{report.confidence}</strong></div>
        </div>
        <p className="report-summary-copy">{report.summary}</p>
        <span className="report-disclaimer">自动验收建议，最终由用户判断。</span>
      </section>
      <section className="report-section report-evidence report-evidence-panel" aria-labelledby="verified-items">
        <h2 id="verified-items">已验证功能</h2>
        <ul>{report.verifiedItems.map((item) => <li key={item.title}><strong>{item.title}</strong><span>{item.status}</span></li>)}</ul>
      </section>
      <section className="report-section report-issues report-issues-panel" aria-labelledby="report-issues">
        <h2 id="report-issues">问题与修复提示词</h2>
        {report.issues.map((issue) => (
          <div className="report-issue" key={issue.title}>
            <div className="report-issue-heading"><h3>{issue.title}</h3><span>{issue.severity}</span></div>
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
