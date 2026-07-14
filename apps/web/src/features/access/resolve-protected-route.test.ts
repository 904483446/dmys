import { describe, expect, it } from 'vitest';

import { resolveProtectedRoute } from './resolve-protected-route.js';

describe('resolveProtectedRoute', () => {
  it('根据会话和内测状态决定报告页跳转', () => {
    expect(resolveProtectedRoute(null)).toBe('/login');
    expect(resolveProtectedRoute('invited')).toBe('/access');
    expect(resolveProtectedRoute('active')).toBeNull();
  });
});
