import { redirect } from 'next/navigation';

import { resolveProtectedRoute } from '../../features/access/resolve-protected-route';
import { ReportsEmptyState } from '../../features/reports/reports-empty-state';
import { createSupabaseServerClient } from '../../lib/supabase/server-client';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
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

  return (
    <main className="shell">
      <p className="eyebrow">VibeVerify / 私有工作区</p>
      <h1>我的报告</h1>
      <ReportsEmptyState />
    </main>
  );
}
