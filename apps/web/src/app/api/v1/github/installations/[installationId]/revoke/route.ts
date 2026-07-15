import { NextResponse } from 'next/server';

import { createSupabaseServerClient } from '../../../../../../../lib/supabase/server-client';

export async function POST(
  _request: Request,
  context: { params: Promise<{ installationId: string }> },
) {
  const supabase = await createSupabaseServerClient();
  if (supabase === null) return error('SERVICE_UNAVAILABLE', '认证服务尚未配置', 503);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) return error('UNAUTHORIZED', '请先登录', 401);

  const { installationId } = await context.params;
  const { data: installation } = await supabase
    .from('github_installations')
    .select('id, revoked_at')
    .eq('id', installationId)
    .maybeSingle();
  if (installation === null)
    return error('GITHUB_INSTALLATION_NOT_FOUND', '未找到 GitHub 安装记录', 404);
  if (installation.revoked_at !== null)
    return error('GITHUB_INSTALLATION_REVOKED', 'GitHub 安装已撤销', 409);

  const revokedAt = new Date().toISOString();
  const { data: revoked } = await supabase
    .from('github_installations')
    .update({ revoked_at: revokedAt })
    .eq('id', installation.id)
    .select('id')
    .maybeSingle();
  if (revoked === null)
    return error('GITHUB_INSTALLATION_NOT_FOUND', '未找到 GitHub 安装记录', 404);

  return NextResponse.json({ installation: { id: revoked.id, revokedAt } });
}

function error(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}
