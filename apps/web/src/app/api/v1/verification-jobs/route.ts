import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createZipJob } from '../../../../features/jobs/create-zip-job';
import { inspectZipArchive } from '../../../../features/jobs/inspect-zip-archive';
import { createSupabaseServerClient } from '../../../../lib/supabase/server-client';

const requestSchema = z.object({
  requestText: z.string().trim().min(1).max(10_000),
  source: z.object({ type: z.literal('zip'), sourceStoragePath: z.string().min(1) }),
  prdStoragePath: z.string().min(1).optional(),
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
      { error: { code: 'INVALID_REQUEST', message: '请输入有效的验收任务信息' } },
      { status: 400 },
    );

  const result = await createZipJob({
    userId: user.id,
    requestText: body.data.requestText,
    sourceStoragePath: body.data.source.sourceStoragePath,
    download: async () => {
      const { data, error } = await supabase.storage
        .from('uploads')
        .download(body.data.source.sourceStoragePath);
      if (error !== null || data === null) throw new Error('SOURCE_NOT_FOUND');
      return Buffer.from(await data.arrayBuffer());
    },
    inspect: inspectZipArchive,
    create: async (metadata) => {
      const { data, error } = await supabase.rpc('create_zip_verification_job', {
        p_display_name: 'ZIP 项目',
        p_request_text: body.data.requestText,
        p_prd_storage_path: body.data.prdStoragePath ?? null,
        p_source_storage_path: body.data.source.sourceStoragePath,
        p_source_snapshot: metadata,
      });
      if (error !== null || data === null) throw new Error('JOB_CREATE_FAILED');
      return { id: data.id, status: data.status };
    },
  });
  if (!result.ok)
    return NextResponse.json(
      { error: { code: result.code, message: result.message } },
      {
        status:
          result.code === 'SOURCE_NOT_FOUND'
            ? 404
            : result.code === 'DAILY_JOB_LIMIT_EXCEEDED'
              ? 429
              : 400,
      },
    );

  return NextResponse.json({ job: result.job });
}
