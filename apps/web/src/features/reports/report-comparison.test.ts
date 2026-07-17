import { describe, expect, it } from 'vitest';

import { compareReports } from './report-comparison.js';

describe('compareReports', () => {
  it('标记新增和已解决的问题标题', () => {
    expect(
      compareReports(
        { score: 60, issues: [{ title: '保存失败' }, { title: '首页空白' }] },
        { score: 80, issues: [{ title: '首页空白' }, { title: '搜索失败' }] },
      ),
    ).toEqual({
      scoreDelta: 20,
      issueCountDelta: 0,
      newlyFound: ['搜索失败'],
      resolved: ['保存失败'],
    });
  });
});
