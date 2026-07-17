import { describe, expect, it } from 'vitest';

import { renderReportMarkdown } from './report-export.js';

describe('renderReportMarkdown', () => {
  it('包含修复提示词但不包含私有来源数据', () => {
    const output = renderReportMarkdown({
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

    expect(output).toContain('修复保存逻辑');
    expect(output).toContain('首页可访问');
    expect(output).not.toContain('artifacts/');
    expect(output).not.toContain('private/repo');
  });
});
