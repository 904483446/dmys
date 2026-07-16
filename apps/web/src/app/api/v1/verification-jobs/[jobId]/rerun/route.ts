import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createSupabaseServerClient } from '../../../../../../lib/supabase/server-client';

const rerunRequestSchema = z.object({
  sourceStoragePath: z.string().min(1).optional(),
  sourceRef: z.string().min(1).max(255).optional(),
});

export async function POST(request: Request, context: { params: Promise<{ jobId: string }> }) {
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

  const { jobId } = await context.params;
  const { data: job } = await supabase
    .from('verification_jobs')
    .select('id')
    .eq('id', jobId)
    .maybeSingle();
  if (job === null)
    return NextResponse.json(
      { error: { code: 'JOB_NOT_FOUND', message: '未找到该验收任务' } },
      { status: 404 },
    );

  const body = rerunRequestSchema.safeParse(await request.json().catch(() => ({})));
  if (!body.success)
    return NextResponse.json(
      { error: { code: 'INVALID_REQUEST', message: '重新验收请求无效' } },
      { status: 400 },
    );

  const { data: rerunJob, error } = await supabase.rpc('rerun_verification_job', {
    p_job_id: jobId,
    p_source_storage_path: body.data.sourceStoragePath ?? null,
    p_source_ref: body.data.sourceRef ?? null,
  });
  if (error !== null || rerunJob === null) {
    const code =
      error?.message === 'DAILY_JOB_LIMIT_EXCEEDED'
        ? 'DAILY_JOB_LIMIT_EXCEEDED'
        : 'JOB_CREATE_FAILED';
    const message =
      code === 'DAILY_JOB_LIMIT_EXCEEDED' ? '今日验收次数已达上限' : '暂时无法重新发起验收';
    return NextResponse.json(
      { error: { code, message } },
      { status: code === 'DAILY_JOB_LIMIT_EXCEEDED' ? 429 : 502 },
    );
  }

  return NextResponse.json({ job: { id: rerunJob.id, status: rerunJob.status } });
}
