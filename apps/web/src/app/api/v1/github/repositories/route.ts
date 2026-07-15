import { NextResponse } from 'next/server';

import { listInstallationRepositories } from '../../../../../features/github/github-app-client';
import { listRepositories } from '../../../../../features/github/list-repositories';
import { createSupabaseServerClient } from '../../../../../lib/supabase/server-client';

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

  const installationId = new URL(request.url).searchParams.get('installationId');
  if (installationId === null || installationId.length === 0)
    return error('INVALID_REQUEST', '请提供有效的 GitHub 安装标识', 400);
  const { data: installation } = await supabase
    .from('github_installations')
    .select('installation_id')
    .eq('id', installationId)
    .is('revoked_at', null)
    .maybeSingle();
  if (installation === null)
    return error('GITHUB_INSTALLATION_NOT_FOUND', '未找到可用的 GitHub 安装记录', 404);

  const result = await listRepositories({
    installationId: installation.installation_id,
    list: listInstallationRepositories,
  });
  if (!result.ok) return error(result.code, result.message, 502);
  return NextResponse.json({ repositories: result.repositories });
}

function error(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}
