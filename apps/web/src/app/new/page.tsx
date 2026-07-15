import { redirect } from 'next/navigation';

import { resolveProtectedRoute } from '../../features/access/resolve-protected-route';
import { createSupabaseServerClient } from '../../lib/supabase/server-client';
import { NewPageContent } from './new-page-content';

export const dynamic = 'force-dynamic';

export default async function NewPage() {
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
  const target = resolveProtectedRoute(profile?.access_status === 'active' ? 'active' : 'invited');
  if (target !== null) redirect(target);

  return <NewPageContent />;
}
