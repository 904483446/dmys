import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createZipJob } from '../../../../features/jobs/create-zip-job';
import { listInstallationRepositories } from '../../../../features/github/github-app-client';
import { inspectZipArchive } from '../../../../features/jobs/inspect-zip-archive';
import { unwrapCreatedZipJobRpcResult } from '../../../../features/jobs/unwrap-created-zip-job-rpc-result';
import { createSupabaseServerClient } from '../../../../lib/supabase/server-client';

const requestSchema = z.object({
  requestText: z.string().trim().min(1).max(10_000),
  source: z.discriminatedUnion('type', [
    z.object({ type: z.literal('zip'), sourceStoragePath: z.string().min(1) }),
    z.object({
      type: z.literal('github'),
      installationId: z.string().min(1),
      repositoryId: z.number().int().positive(),
      ref: z.string().trim().min(1).max(255),
    }),
  ]),
  prdStoragePath: z.string().min(1).optional(),
});

export async function GET(_request: Request) {
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

  const status = new URL(_request.url).searchParams.get('status') ?? 'all';
  if (!['all', 'active', 'completed'].includes(status))
    return NextResponse.json(
      { error: { code: 'INVALID_REQUEST', message: '任务状态筛选无效' } },
      { status: 400 },
    );

  let query = supabase.from('verification_jobs').select('id, status, created_at');
  if (status === 'active')
    query = query.in('status', [
      'queued',
      'preparing',
      'building',
      'running',
      'testing',
      'reporting',
    ]);
  if (status === 'completed') query = query.in('status', ['completed', 'failed', 'timed_out']);
  const { data: jobs, error } = await query.order('created_at', { ascending: false }).limit(50);
  if (error !== null)
    return NextResponse.json(
      { error: { code: 'JOB_LIST_UNAVAILABLE', message: '暂时无法读取验收任务' } },
      { status: 502 },
    );

  return NextResponse.json({
    jobs: (jobs ?? []).map((job) => ({
      id: job.id,
      status: job.status,
      createdAt: job.created_at,
    })),
  });
}

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

  const source = body.data.source;
  if (source.type === 'github') {
    const { data: installation } = await supabase
      .from('github_installations')
      .select('installation_id')
      .eq('id', source.installationId)
      .is('revoked_at', null)
      .maybeSingle();
    if (installation === null)
      return NextResponse.json(
        {
          error: { code: 'GITHUB_INSTALLATION_NOT_FOUND', message: '未找到可用的 GitHub 安装记录' },
        },
        { status: 404 },
      );

    let repositories: Array<{ id: number; full_name: string }>;
    try {
      repositories = await listInstallationRepositories(installation.installation_id);
    } catch {
      return NextResponse.json(
        {
          error: {
            code: 'GITHUB_REPOSITORIES_UNAVAILABLE',
            message: '暂时无法确认 GitHub 仓库授权',
          },
        },
        { status: 502 },
      );
    }
    const repository = repositories.find((item) => item.id === source.repositoryId);
    if (repository === undefined)
      return NextResponse.json(
        { error: { code: 'GITHUB_REPOSITORY_NOT_FOUND', message: '未找到已授权的 GitHub 仓库' } },
        { status: 404 },
      );

    const { data: job, error } = await supabase.rpc('create_github_verification_job', {
      p_display_name: repository.full_name.split('/').at(-1) ?? 'GitHub 项目',
      p_installation_id: source.installationId,
      p_prd_storage_path: body.data.prdStoragePath ?? null,
      p_repository_full_name: repository.full_name,
      p_repository_id: source.repositoryId,
      p_request_text: body.data.requestText,
      p_source_ref: source.ref,
    });
    if (error !== null || job === null) {
      const quotaExceeded = error?.message === 'DAILY_JOB_LIMIT_EXCEEDED';
      return NextResponse.json(
        {
          error: {
            code: quotaExceeded ? 'DAILY_JOB_LIMIT_EXCEEDED' : 'JOB_CREATE_FAILED',
            message: quotaExceeded ? '今日验收次数已达上限' : '暂时无法创建验收任务',
          },
        },
        { status: quotaExceeded ? 429 : 502 },
      );
    }
    return NextResponse.json({ job: { id: job.id, status: job.status } });
  }

  const result = await createZipJob({
    userId: user.id,
    requestText: body.data.requestText,
    sourceStoragePath: source.sourceStoragePath,
    download: async () => {
      const { data, error } = await supabase.storage
        .from('uploads')
        .download(source.sourceStoragePath);
      if (error !== null || data === null) throw new Error('SOURCE_NOT_FOUND');
      return Buffer.from(await data.arrayBuffer());
    },
    inspect: inspectZipArchive,
    create: async (metadata) => {
      const { data, error } = await supabase.rpc('create_zip_verification_job', {
        p_display_name: 'ZIP 项目',
        p_request_text: body.data.requestText,
        p_prd_storage_path: body.data.prdStoragePath ?? null,
        p_source_storage_path: source.sourceStoragePath,
        p_source_snapshot: metadata,
      });
      return unwrapCreatedZipJobRpcResult({ data, error });
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
