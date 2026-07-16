import Link from 'next/link';
import { redirect } from 'next/navigation';

import { resolveProtectedRoute } from '../../../features/access/resolve-protected-route';
import { createSupabaseServerClient } from '../../../lib/supabase/server-client';

type ReportDetailPageProps = { params: Promise<{ id: string }> };
export const dynamic = 'force-dynamic';

export default async function ReportDetailPage({ params }: ReportDetailPageProps) {
  const supabase = await createSupabaseServerClient();
  if (supabase === null) redirect('/login');
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) redirect('/login');
  const { data: profile } = await supabase
    .from('profiles')
    .select('access_status')
    .eq('id', user.id)
    .maybeSingle();
  const target = resolveProtectedRoute(
    profile?.access_status === 'active'
      ? 'active'
      : profile?.access_status === 'blocked'
        ? 'blocked'
        : 'invited',
  );
  if (target !== null) redirect(target);
  const { id } = await params;
  const { data: job } = await supabase
    .from('verification_jobs')
    .select(
      'id, status, request_text, error_code, error_message, created_at, verification_reports(verdict, score, confidence, summary)',
    )
    .eq('id', id)
    .maybeSingle();
  if (job === null) redirect('/reports');
  const report = job.verification_reports[0] ?? null;

  return (
    <main className="shell">
      <p className="eyebrow">VibeVerify / 私有报告</p>
      <h1>验收报告</h1>
      <section className="demo" aria-label="验收任务详情">
        <strong>当前状态：{job.status}</strong>
        <span>创建时间：{new Date(job.created_at).toLocaleString('zh-CN')}</span>
        <span>需求：{job.request_text}</span>
        {job.error_message === null ? null : <span>说明：{job.error_message}</span>}
        {report === null ? <span>报告正在准备。</span> : <span>结论：{report.summary}</span>}
      </section>
      <Link href="/reports">返回我的报告</Link>
    </main>
  );
}
