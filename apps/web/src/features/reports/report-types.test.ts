import { describe, expect, it } from 'vitest';

import * as reportTypes from './report-types.js';

const firstEmbeddedReport = (reportTypes as Record<string, unknown>).firstEmbeddedReport as
  | ((input: unknown) => unknown | null)
  | undefined;
const formatReportCreatedAt = (reportTypes as Record<string, unknown>).formatReportCreatedAt as
  | ((input: string) => string)
  | undefined;
const formatReportVerdict = (reportTypes as Record<string, unknown>).formatReportVerdict as
  | ((input: 'passed' | 'at_risk' | 'failed') => string)
  | undefined;
const formatVerificationItemStatus = (reportTypes as Record<string, unknown>).formatVerificationItemStatus as
  | ((input: 'verified' | 'not_verified' | 'manual_review') => string)
  | undefined;
const formatIssueSeverity = (reportTypes as Record<string, unknown>).formatIssueSeverity as
  | ((input: 'critical' | 'major' | 'minor') => string)
  | undefined;

describe('toReportDetail', () => {
  it('formats report enums as user-facing Chinese labels', () => {
    expect(formatReportVerdict).toBeTypeOf('function');
    expect(formatVerificationItemStatus).toBeTypeOf('function');
    expect(formatIssueSeverity).toBeTypeOf('function');
    expect(formatReportVerdict?.('at_risk')).toBe('有风险');
    expect(formatVerificationItemStatus?.('verified')).toBe('已验证');
    expect(formatVerificationItemStatus?.('manual_review')).toBe('待人工补充');
    expect(formatIssueSeverity?.('major')).toBe('重要');
  });

  it('preserves a requirement and execution detail for manual-review items', () => {
    expect(
      reportTypes.toReportDetail({
        verdict: 'at_risk', score: 70, confidence: 65, summary: '需要补充验收条件',
        verified_items: [{
          title: '待人工补充验收条件',
          sourceRequirement: '登录后删除账户',
          detail: '涉及禁止自动执行的删除操作。',
          evidenceIds: [],
          status: 'manual_review',
        }],
        issues: [],
      }).verifiedItems,
    ).toEqual([expect.objectContaining({
      sourceRequirement: '登录后删除账户',
      detail: '涉及禁止自动执行的删除操作。',
      status: 'manual_review',
    })]);
  });

  it('formats report timestamps in China Standard Time on the server', () => {
    expect(formatReportCreatedAt).toBeTypeOf('function');
    expect(formatReportCreatedAt?.('2026-07-23T08:50:51.000Z')).toContain('16:50:51');
  });

  it('returns null when a failed job has no embedded report', () => {
    expect(firstEmbeddedReport).toBeTypeOf('function');
    expect(firstEmbeddedReport?.(null)).toBeNull();
  });

  it('reads the first report from an embedded relation list', () => {
    const report = { verdict: 'passed' };
    expect(firstEmbeddedReport?.([report])).toBe(report);
  });

  it('保留报告展示字段而丢弃私有来源字段', () => {
    expect(
      reportTypes.toReportDetail({
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
      verifiedItems: [{
        title: '首页可访问',
        sourceRequirement: '历史报告未保留原始需求',
        detail: '历史报告未保留执行结果',
        evidenceIds: ['homepage-ok'],
        status: 'verified',
      }],
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
