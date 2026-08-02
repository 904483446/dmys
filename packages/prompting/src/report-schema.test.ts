import { describe, expect, it } from 'vitest';

import { verificationReportSchema } from './report-schema.js';

describe('verificationReportSchema', () => {
  it('拒绝缺少修复提示词的问题，避免前端报告无法展示核心修复功能', () => {
    expect(
      verificationReportSchema.safeParse({
        verdict: 'at_risk',
        score: 50,
        confidence: 40,
        summary: '发现保存问题',
        verifiedItems: [],
        issues: [
          {
            severity: 'major',
            title: '保存失败',
            description: '提交后未更新',
            evidenceIds: ['homepage-status'],
          },
        ],
      }).success,
    ).toBe(false);
  });

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

  it('accepts manual-review items without treating them as failed execution', () => {
    expect(
      verificationReportSchema.safeParse({
        verdict: 'at_risk', score: 70, confidence: 65, summary: '需补充一个验收条件',
        verifiedItems: [{
          title: '导出报表', sourceRequirement: '点击导出', detail: '未执行',
          status: 'manual_review', evidenceIds: [],
        }],
        issues: [],
      }).success,
    ).toBe(true);
  });
});
