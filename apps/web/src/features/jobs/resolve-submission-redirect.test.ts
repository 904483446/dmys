import { describe, expect, it } from 'vitest';

import { resolveSubmissionRedirect } from './resolve-submission-redirect.js';

describe('resolveSubmissionRedirect', () => {
  it('仅在创建成功时跳转到报告列表', () => {
    expect(resolveSubmissionRedirect(true)).toBe('/reports');
    expect(resolveSubmissionRedirect(false)).toBeNull();
  });
});
