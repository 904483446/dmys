import Link from 'next/link';
import { redirect } from 'next/navigation';

import { resolveProtectedRoute } from '../../../features/access/resolve-protected-route';
import { ReportDetail } from '../../../features/reports/report-detail';
import { toReportDetail } from '../../../features/reports/report-types';
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
      'id, status, request_text, error_code, error_message, created_at, verification_reports(verdict, score, confidence, summary, verified_items, issues)',
    )
    .eq('id', id)
    .maybeSingle();
  if (job === null) redirect('/reports');
  const rawReport = job.verification_reports[0] ?? null;
  const report = rawReport === null ? null : toReportDetail(rawReport);

  return (
    <main className="shell">
      <p className="eyebrow">VibeVerify / 私有报告</p>
      <h1>验收报告</h1>
      <p>创建时间：{new Date(job.created_at).toLocaleString('zh-CN')}</p>
      <p>需求：{job.request_text}</p>
      <ReportDetail jobId={job.id} status={job.status} report={report} errorMessage={job.error_message} />
      <Link href="/reports">返回我的报告</Link>
    </main>
  );
}
