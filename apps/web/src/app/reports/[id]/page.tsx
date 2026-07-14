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

  return (
    <main className="shell">
      <p className="eyebrow">VibeVerify / 私有报告</p>
      <h1>验收报告</h1>
      <section className="demo" aria-label="报告详情占位">
        <strong>报告正在准备</strong>
        <span>报告编号：{id}</span>
        <span>完成后将展示结论、分数、证据与可复制修复提示词。</span>
      </section>
      <Link href="/reports">返回我的报告</Link>
    </main>
  );
}
