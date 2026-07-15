import { NextResponse } from 'next/server';

import { createInstallState } from '../../../../../../features/github/install-state';
import { createSupabaseServerClient } from '../../../../../../lib/supabase/server-client';

export async function POST() {
  const supabase = await createSupabaseServerClient();
  if (supabase === null)
    return NextResponse.json(
      { error: { code: 'SERVICE_UNAVAILABLE', message: '认证服务尚未配置' } },
      { status: 503 },
    );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null)
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: '请先登录' } },
      { status: 401 },
    );

  const { data: profile } = await supabase
    .from('profiles')
    .select('access_status')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.access_status !== 'active')
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: '请先激活内测权限' } },
      { status: 403 },
    );

  const appSlug = process.env.GITHUB_APP_SLUG;
  const stateSecret = process.env.GITHUB_STATE_ENCRYPTION_KEY;
  if (
    appSlug === undefined ||
    appSlug.length === 0 ||
    stateSecret === undefined ||
    stateSecret.length === 0
  )
    return NextResponse.json(
      { error: { code: 'SERVICE_UNAVAILABLE', message: 'GitHub 安装服务尚未配置' } },
      { status: 503 },
    );

  const state = createInstallState({
    userId: user.id,
    now: Math.floor(Date.now() / 1000),
    secret: stateSecret,
    nonce: crypto.randomUUID(),
  });
  return NextResponse.json({
    installUrl: `https://github.com/apps/${encodeURIComponent(appSlug)}/installations/new?state=${encodeURIComponent(state)}`,
  });
}
