import { describe, expect, it } from 'vitest';

import { createDeterministicReport } from './deterministic-report.js';
import { verificationReportSchema } from './report-schema.js';

describe('createDeterministicReport', () => {
  it('在模型不可用且首页可达时创建带证据的 at_risk 报告', () => {
    const report = createDeterministicReport({
      homepageReachable: true,
      evidenceIds: ['homepage-status'],
    });

    expect(report).toMatchObject({
      verdict: 'at_risk',
      score: 50,
      confidence: 40,
      verifiedItems: [{ status: 'verified', evidenceIds: ['homepage-status'] }],
    });
    expect(verificationReportSchema.safeParse(report).success).toBe(true);
  });

  it('在首页不可达时创建 failed 报告', () => {
    expect(
      createDeterministicReport({ homepageReachable: false, evidenceIds: ['homepage-status'] })
        .verdict,
    ).toBe('failed');
  });
});
