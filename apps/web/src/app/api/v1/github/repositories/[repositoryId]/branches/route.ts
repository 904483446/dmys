import { NextResponse } from 'next/server';

import { listInstallationBranches } from '../../../../../../../features/github/github-app-client';
import { listBranches } from '../../../../../../../features/github/list-branches';
import { createSupabaseServerClient } from '../../../../../../../lib/supabase/server-client';

export async function GET(
  request: Request,
  context: { params: Promise<{ repositoryId: string }> },
) {
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
  const { repositoryId: rawRepositoryId } = await context.params;
  const repositoryId = Number(rawRepositoryId);
  if (
    installationId === null ||
    installationId.length === 0 ||
    !Number.isSafeInteger(repositoryId) ||
    repositoryId <= 0
  )
    return error('INVALID_REQUEST', '请提供有效的仓库与 GitHub 安装标识', 400);

  const { data: installation } = await supabase
    .from('github_installations')
    .select('installation_id')
    .eq('id', installationId)
    .is('revoked_at', null)
    .maybeSingle();
  if (installation === null)
    return error('GITHUB_INSTALLATION_NOT_FOUND', '未找到可用的 GitHub 安装记录', 404);

  const result = await listBranches({
    installationId: installation.installation_id,
    repositoryId,
    list: listInstallationBranches,
  });
  if (!result.ok) return error(result.code, result.message, 502);
  return NextResponse.json({ branches: result.branches });
}

function error(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}
