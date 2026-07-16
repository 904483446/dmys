import { describe, expect, it } from 'vitest';

import { verificationReportSchema } from './report-schema.js';

describe('verificationReportSchema', () => {
  it('拒绝声称已验证但没有 evidence id 的条目', () => {
    expect(
      verificationReportSchema.safeParse({
        verdict: 'passed',
        score: 90,
        confidence: 80,
        summary: '通过',
        verifiedItems: [{ title: '首页', status: 'verified', evidenceIds: [] }],
        issues: [],
      }).success,
    ).toBe(false);
  });
});
