import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AppShell } from '../../../components/app-shell';
import { resolveProtectedRoute } from '../../../features/access/resolve-protected-route';
import { compareReports } from '../../../features/reports/report-comparison';
import { ReportDetail } from '../../../features/reports/report-detail';
import { firstEmbeddedReport, formatReportCreatedAt, toReportDetail } from '../../../features/reports/report-types';
import { createSupabaseServerClient } from '../../../lib/supabase/server-client';

type ReportDetailPageProps = { params: Promise<{ id: string }> };
export const dynamic = 'force-dynamic';

export default async function ReportDetailPage({ params }: ReportDetailPageProps) {
  const supabase = await createSupabaseServerClient();
  if (supabase === null) redirect('/login');
  const { data: { user } } = await supabase.auth.getUser();
  if (user === null) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('access_status').eq('id', user.id).maybeSingle();
  const target = resolveProtectedRoute(profile?.access_status === 'active' ? 'active' : profile?.access_status === 'blocked' ? 'blocked' : 'invited');
  if (target !== null) redirect(target);
  const { id } = await params;
  const { data: job } = await supabase
    .from('verification_jobs')
    .select('id, project_id, status, request_text, error_code, error_message, created_at, verification_reports(verdict, score, confidence, summary, verified_items, issues)')
    .eq('id', id)
    .maybeSingle();
  if (job === null) redirect('/reports');
  const rawReport = firstEmbeddedReport(job.verification_reports);
  const report = rawReport === null ? null : toReportDetail(rawReport);
  const { data: previousJob } = report === null
    ? { data: null }
    : await supabase.from('verification_jobs').select('verification_reports(verdict, score, confidence, summary, verified_items, issues)').eq('project_id', job.project_id).lt('created_at', job.created_at).in('status', ['completed', 'failed']).order('created_at', { ascending: false }).limit(1).maybeSingle();
  const previousRawReport = firstEmbeddedReport(previousJob?.verification_reports);
  const comparison = previousRawReport === null || report === null ? null : compareReports(toReportDetail(previousRawReport), report);

  return (
    <AppShell title="验收报告">
      <main className="shell workspace-page report-workspace">
        <header className="workspace-heading"><p className="eyebrow">验收工作区</p><h1>验收报告</h1><p>创建时间：{formatReportCreatedAt(job.created_at)}</p><p>需求：{job.request_text}</p></header>
        <ReportDetail jobId={job.id} status={job.status} report={report} errorMessage={job.error_message} comparison={comparison} />
        <Link className="report-back-link" href="/reports">返回我的报告</Link>
      </main>
    </AppShell>
  );
}
