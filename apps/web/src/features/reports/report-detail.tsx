import type { ReportDetail as Report } from './report-types.js';
import { ReportActions } from './report-actions';
import type { ReportComparison } from './report-comparison.js';

type Props = { jobId: string; status: string; report: Report | null; errorMessage: string | null; comparison?: ReportComparison | null };

export function ReportDetail({ jobId, status, report, errorMessage, comparison = null }: Props) {
  if (report === null)
    return (
      <section className="demo" aria-live="polite">
        <strong>当前状态：{status}</strong>
        <span>{errorMessage ?? '报告正在准备。'}</span>
        {(status === 'failed' || status === 'timed_out') && <button type="button">重新验收</button>}
      </section>
    );
  return (
    <article className="report-detail">
      <section className="demo" aria-label="验收结论">
        <strong>结论：{report.verdict}</strong>
        <span>评分：{report.score}</span>
        <span>置信度：{report.confidence}</span>
        <span>{report.summary}</span>
        <span>自动验收建议，最终由用户判断。</span>
      </section>
      <section className="report-section" aria-labelledby="verified-items">
        <h2 id="verified-items">已验证功能</h2>
        <ul>{report.verifiedItems.map((item) => <li key={item.title}>{item.title}（{item.status}）</li>)}</ul>
      </section>
      <section className="report-section" aria-labelledby="report-issues">
        <h2 id="report-issues">问题与修复提示词</h2>
        {report.issues.map((issue) => <div key={issue.title}><h3>{issue.title}</h3><p>严重级别：{issue.severity}</p><p>{issue.description}</p><p>修复提示词：{issue.repairPrompt}</p><ReportActions jobId={jobId} repairPrompt={issue.repairPrompt} /></div>)}
      </section>
      {comparison !== null && <section className="report-section"><h2>与上次验收相比</h2><p>评分变化：{comparison.scoreDelta}；问题数量变化：{comparison.issueCountDelta}</p><p>新增问题：{comparison.newlyFound.join('、') || '无'}</p><p>已解决问题：{comparison.resolved.join('、') || '无'}</p></section>}
    </article>
  );
}
