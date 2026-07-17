import { describe, expect, it } from 'vitest';

import { toReportDetail } from './report-types.js';

describe('toReportDetail', () => {
  it('保留报告展示字段而丢弃私有来源字段', () => {
    expect(
      toReportDetail({
        verdict: 'at_risk',
        score: 64,
        confidence: 70,
        summary: '存在风险',
        verified_items: [
          { title: '首页可访问', evidenceIds: ['homepage-ok'], status: 'verified' },
        ],
        issues: [
          {
            severity: 'major',
            title: '保存失败',
            description: '提交后未更新',
            evidenceIds: ['console-1'],
            repairPrompt: '修复保存逻辑',
          },
        ],
        storage_path: 'artifacts/user/job/screenshot.png',
        github_repository_full_name: 'private/repo',
      }),
    ).toEqual({
      verdict: 'at_risk',
      score: 64,
      confidence: 70,
      summary: '存在风险',
      verifiedItems: [{ title: '首页可访问', evidenceIds: ['homepage-ok'], status: 'verified' }],
      issues: [
        {
          severity: 'major',
          title: '保存失败',
          description: '提交后未更新',
          evidenceIds: ['console-1'],
          repairPrompt: '修复保存逻辑',
        },
      ],
    });
  });
});
