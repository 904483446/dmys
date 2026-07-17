import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import { NextResponse } from 'next/server';
import { createElement } from 'react';
import type { ReactElement } from 'react';
import { z } from 'zod';

import { renderReportMarkdown } from '../../../../../../features/reports/report-export';
import { ReportPdfDocument } from '../../../../../../features/reports/report-pdf';
import { toReportDetail } from '../../../../../../features/reports/report-types';
import { createSupabaseServerClient } from '../../../../../../lib/supabase/server-client';

const exportRequestSchema = z.object({ format: z.enum(['markdown', 'pdf']) });

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
  const body = exportRequestSchema.safeParse(await request.json().catch(() => ({})));
  if (!body.success)
    return NextResponse.json(
      { error: { code: 'INVALID_REQUEST', message: '导出格式无效' } },
      { status: 400 },
    );
  const { jobId } = await context.params;
  const { data: job } = await supabase
    .from('verification_jobs')
    .select('id, status, verification_reports(verdict, score, confidence, summary, verified_items, issues)')
    .eq('id', jobId)
    .maybeSingle();
  if (job === null)
    return NextResponse.json(
      { error: { code: 'JOB_NOT_FOUND', message: '未找到该验收任务' } },
      { status: 404 },
    );
  if (job.status !== 'completed' && job.status !== 'failed')
    return NextResponse.json(
      { error: { code: 'JOB_NOT_COMPLETED', message: '验收尚未完成，暂不能导出' } },
      { status: 409 },
    );
  if (job.verification_reports === null)
    return NextResponse.json(
      { error: { code: 'REPORT_NOT_FOUND', message: '验收报告尚未生成' } },
      { status: 404 },
    );
  const report = toReportDetail(job.verification_reports);
  const fileName = `vibeverify-report-${jobId}.${body.data.format === 'markdown' ? 'md' : 'pdf'}`;
  if (body.data.format === 'markdown')
    return new NextResponse(renderReportMarkdown(report), {
      headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Content-Disposition': `attachment; filename="${fileName}"` },
    });
  const document = createElement(ReportPdfDocument, { report }) as ReactElement<DocumentProps>;
  const pdf = await renderToBuffer(document);
  const bytes = pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength) as ArrayBuffer;
  return new NextResponse(bytes, {
    headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${fileName}"` },
  });
}
