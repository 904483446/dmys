import Link from 'next/link';

export function ReportsEmptyState() {
  return (
    <section className="reports-empty reports-workspace-empty" aria-label="报告空状态">
      <strong>还没有验收报告</strong>
      <span>从一次验收开始。提交项目后，这里会保留每次验收的私有结论和证据。</span>
      <Link className="primary reports-empty-action" href="/new">
        新建验收
      </Link>
    </section>
  );
}
