import { NextResponse } from 'next/server';

import { completeInstallation } from '../../../../../../features/github/complete-installation';
import { getInstallationAccountLogin } from '../../../../../../features/github/github-app-client';
import { decodeInstallState } from '../../../../../../features/github/install-state';
import { createSupabaseServerClient } from '../../../../../../lib/supabase/server-client';

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (supabase === null) return error('SERVICE_UNAVAILABLE', '认证服务尚未配置', 503);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) return error('UNAUTHORIZED', '请先登录', 401);

  const { data: profile } = await supabase
    .from('profiles')
    .select('access_status')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.access_status !== 'active') return error('FORBIDDEN', '请先激活内测权限', 403);

  const url = new URL(request.url);
  const state = url.searchParams.get('state');
  const installationId = Number(url.searchParams.get('installation_id'));
  const stateSecret = process.env.GITHUB_STATE_ENCRYPTION_KEY;
  if (state === null || stateSecret === undefined || stateSecret.length === 0)
    return error('INVALID_GITHUB_INSTALLATION_STATE', 'GitHub 安装请求已失效，请重新发起连接', 400);

  const now = Math.floor(Date.now() / 1000);
  const verifyState = (candidate: string, userId: string) =>
    decodeInstallState({ state: candidate, now, secret: stateSecret, expectedUserId: userId });
  if (
    !Number.isSafeInteger(installationId) ||
    installationId <= 0 ||
    !verifyState(state, user.id).ok
  )
    return error('INVALID_GITHUB_INSTALLATION_STATE', 'GitHub 安装请求已失效，请重新发起连接', 400);

  const account = await getInstallationAccountLogin(installationId);
  if (!account.ok) return error(account.code, account.message, 502);

  const result = await completeInstallation({
    state,
    userId: user.id,
    installationId,
    accountLogin: account.accountLogin,
    verifyState,
    upsert: async (installation) =>
      supabase.from('github_installations').upsert(
        {
          user_id: installation.userId,
          installation_id: installation.installationId,
          account_login: installation.accountLogin,
          revoked_at: null,
        },
        { onConflict: 'installation_id' },
      ),
  });
  if (!result.ok) return error(result.code, result.message, 502);

  return NextResponse.redirect(new URL('/settings', request.url));
}

function error(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}
