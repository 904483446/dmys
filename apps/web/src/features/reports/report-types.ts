import { z } from 'zod';

const verifiedItemSchema = z.object({
  title: z.string(),
  evidenceIds: z.array(z.string()),
  status: z.enum(['verified', 'not_verified']),
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

export function toReportDetail(input: unknown): ReportDetail {
  const report = rawReportSchema.parse(input);

  return {
    verdict: report.verdict,
    score: report.score,
    confidence: report.confidence,
    summary: report.summary,
    verifiedItems: z.array(verifiedItemSchema).parse(report.verified_items),
    issues: z.array(issueSchema).parse(report.issues),
  };
}
