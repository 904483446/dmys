import { z } from 'zod';

const verifiedItemSchema = z
  .object({
    title: z.string().min(1),
    status: z.enum(['verified', 'not_verified']),
    evidenceIds: z.array(z.string().min(1)),
  })
  .superRefine((item, context) => {
    if (item.status === 'verified' && item.evidenceIds.length === 0)
      context.addIssue({ code: 'custom', message: '已验证条目必须引用证据' });
  });

const issueSchema = z.object({
  severity: z.enum(['critical', 'major', 'minor']),
  title: z.string().min(1),
  description: z.string().min(1),
  evidenceIds: z.array(z.string().min(1)),
  repairPrompt: z.string().min(1),
});

export const verificationReportSchema = z.object({
  verdict: z.enum(['passed', 'at_risk', 'failed']),
  score: z.number().int().min(0).max(100),
  confidence: z.number().int().min(0).max(100),
  summary: z.string().min(1),
  verifiedItems: z.array(verifiedItemSchema),
  issues: z.array(issueSchema),
});
