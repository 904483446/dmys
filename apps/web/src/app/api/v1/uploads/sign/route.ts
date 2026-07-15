import { NextResponse } from 'next/server';
import { z } from 'zod';

import { validateUploadRequest } from '../../../../../features/uploads/upload-request-policy';
import { createUploadSignature } from '../../../../../features/uploads/create-upload-signature';
import { createSupabaseServerClient } from '../../../../../lib/supabase/server-client';

const requestSchema = z.object({
  kind: z.enum(['source_zip', 'prd']),
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(255),
  sizeBytes: z.number().int().positive(),
});

export async function POST(request: Request) {
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

  const body = requestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success)
    return NextResponse.json(
      { error: { code: 'INVALID_REQUEST', message: '请输入有效的上传信息' } },
      { status: 400 },
    );

  const policy = validateUploadRequest(body.data);
  if (!policy.ok)
    return NextResponse.json(
      { error: { code: policy.code, message: policy.message } },
      { status: 400 },
    );

  const signature = await createUploadSignature({
    userId: user.id,
    fileName: body.data.fileName,
    randomId: () => crypto.randomUUID(),
    createSignedUploadUrl: (path) => supabase.storage.from('uploads').createSignedUploadUrl(path),
  });
  if (!signature.ok)
    return NextResponse.json(
      { error: { code: signature.code, message: signature.message } },
      { status: 502 },
    );

  return NextResponse.json({ upload: signature.upload });
}
