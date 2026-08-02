import { z } from 'zod';

const verifiedItemSchema = z.object({
  title: z.string(),
  sourceRequirement: z.string().optional(),
  detail: z.string().optional(),
  evidenceIds: z.array(z.string()),
  status: z.enum(['verified', 'not_verified', 'manual_review']),
});

const issueSchema = z.object({
  severity: z.enum(['critical', 'major', 'minor']),
  title: z.string(),
  description: z.string(),
  evidenceIds: z.array(z.string()),
  repairPrompt: z.string(),
});

const rawReportSchema = z
  .object({
    verdict: z.enum(['passed', 'at_risk', 'failed']),
    score: z.number().int().min(0).max(100),
    confidence: z.number().int().min(0).max(100),
    summary: z.string(),
    verified_items: z.unknown(),
    issues: z.unknown(),
  })
  .passthrough();

export type ReportDetail = {
  verdict: 'passed' | 'at_risk' | 'failed';
  score: number;
  confidence: number;
  summary: string;
  verifiedItems: z.infer<typeof verifiedItemSchema>[];
  issues: z.infer<typeof issueSchema>[];
};

export function formatReportVerdict(verdict: ReportDetail['verdict']): string {
  return {
    passed: '通过',
    at_risk: '有风险',
    failed: '未通过',
  }[verdict];
}

export function formatVerificationItemStatus(status: ReportDetail['verifiedItems'][number]['status']): string {
  return {
    verified: '已验证',
    not_verified: '未验证',
    manual_review: '待人工补充',
  }[status];
}

export function formatIssueSeverity(severity: ReportDetail['issues'][number]['severity']): string {
  return {
    critical: '严重',
    major: '重要',
    minor: '轻微',
  }[severity];
}

export function firstEmbeddedReport(input: unknown): unknown | null {
  if (Array.isArray(input)) return input[0] ?? null;
  return input ?? null;
}

export function formatReportCreatedAt(input: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(input));
}

export function toReportDetail(input: unknown): ReportDetail {
  const report = rawReportSchema.parse(input);

  return {
    verdict: report.verdict,
    score: report.score,
    confidence: report.confidence,
    summary: report.summary,
    verifiedItems: z.array(verifiedItemSchema).parse(report.verified_items).map((item) => ({
      ...item,
      sourceRequirement: item.sourceRequirement ?? '历史报告未保留原始需求',
      detail: item.detail ?? '历史报告未保留执行结果',
    })),
    issues: z.array(issueSchema).parse(report.issues),
  };
}
