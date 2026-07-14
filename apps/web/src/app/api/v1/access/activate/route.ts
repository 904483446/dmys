import { NextResponse } from 'next/server';
import { z } from 'zod';

import { decideAccessActivation } from '../../../../../features/access/decide-access-activation';
import { validateBetaAccessCode } from '../../../../../features/access/validate-beta-access-code';
import { createSupabaseServerClient } from '../../../../../lib/supabase/server-client';

const requestSchema = z.object({ code: z.string().min(1).max(128) });

export async function POST(request: Request) {
  const body = requestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success)
    return NextResponse.json(
      { error: { code: 'INVALID_REQUEST', message: '请输入有效的内测码' } },
      { status: 400 },
    );

  const supabase = await createSupabaseServerClient();
  if (supabase === null)
    return NextResponse.json(
      { error: { code: 'SERVICE_UNAVAILABLE', message: '认证服务尚未配置' } },
      { status: 503 },
    );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const decision = decideAccessActivation({
    userId: user?.id ?? null,
    isCodeValid: validateBetaAccessCode(body.data.code, process.env.BETA_ACCESS_CODE),
  });
  if (!decision.ok)
    return NextResponse.json(
      { error: { code: decision.code, message: decision.message } },
      { status: decision.code === 'UNAUTHORIZED' ? 401 : 403 },
    );

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user!.id, access_status: 'active' });
  if (error)
    return NextResponse.json(
      { error: { code: 'ACCESS_ACTIVATION_FAILED', message: '暂时无法激活内测权限' } },
      { status: 500 },
    );

  return NextResponse.json({ profile: { accessStatus: 'active' } });
}
