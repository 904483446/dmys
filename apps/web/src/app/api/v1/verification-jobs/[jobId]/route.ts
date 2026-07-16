import { NextResponse } from 'next/server';

import { createSupabaseServerClient } from '../../../../../lib/supabase/server-client';

export async function GET(_request: Request, context: { params: Promise<{ jobId: string }> }) {
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
    .select(
      'id, status, request_text, error_code, error_message, created_at, started_at, finished_at, verification_reports(verdict, score, confidence, summary)',
    )
    .eq('id', jobId)
    .maybeSingle();
  if (job === null)
    return NextResponse.json(
      { error: { code: 'JOB_NOT_FOUND', message: '未找到该验收任务' } },
      { status: 404 },
    );
  const { verification_reports: report, ...jobSummary } = job;
  return NextResponse.json({ job: jobSummary, report: report ?? null });
}
