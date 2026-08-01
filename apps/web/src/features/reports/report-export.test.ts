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

  it('exports Chinese report labels and 100-point metrics', () => {
    const output = renderReportMarkdown({
      verdict: 'at_risk',
      score: 64,
      confidence: 70,
      summary: '存在风险',
      verifiedItems: [{ title: '首页可访问', evidenceIds: [], status: 'verified' }],
      issues: [{ severity: 'major', title: '保存失败', description: '提交后未更新', evidenceIds: [], repairPrompt: '修复保存逻辑' }],
    });

    expect(output).toContain('结论：有风险');
    expect(output).toContain('评分：64 / 100');
    expect(output).toContain('置信度：70 / 100');
    expect(output).toContain('首页可访问：已验证');
    expect(output).not.toContain('at_risk');
    expect(output).not.toContain('verified');
  });

  it('groups verified and unverified checks under an accurate heading', () => {
    const output = renderReportMarkdown({
      verdict: 'at_risk', score: 50, confidence: 70, summary: '存在风险', issues: [],
      verifiedItems: [
        { title: '首页可访问', evidenceIds: ['homepage'], status: 'verified' },
        { title: '添加任务', evidenceIds: ['add'], status: 'not_verified' },
      ],
    });

    expect(output).toContain('## 功能验收明细');
    expect(output).toContain('### 已验证（1）');
    expect(output).toContain('### 未验证（1）');
  });
});
