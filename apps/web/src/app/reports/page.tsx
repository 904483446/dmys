import { redirect } from 'next/navigation';

import { AppShell } from '../../components/app-shell';
import { resolveProtectedRoute } from '../../features/access/resolve-protected-route';
import { JobsList } from '../../features/reports/jobs-list';
import { createSupabaseServerClient } from '../../lib/supabase/server-client';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const supabase = await createSupabaseServerClient();
  if (supabase === null) redirect('/login');
  const { data: { user } } = await supabase.auth.getUser();
  if (user === null) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('access_status').eq('id', user.id).maybeSingle();
  const target = resolveProtectedRoute(
    profile?.access_status === 'active' ? 'active' : profile?.access_status === 'blocked' ? 'blocked' : 'invited',
  );
  if (target !== null) redirect(target);
  const { data: jobs } = await supabase
    .from('verification_jobs')
    .select('id, status, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <AppShell title="我的报告">
      <main className="shell workspace-page reports-workspace">
        <header className="workspace-heading">
          <p className="eyebrow">验收工作区</p>
          <h1>我的报告</h1>
          <p>查看每次验收的状态、结论和后续修复建议。</p>
        </header>
        <JobsList initialJobs={(jobs ?? []).map((job) => ({ id: job.id, status: job.status, createdAt: job.created_at }))} />
      </main>
    </AppShell>
  );
}
