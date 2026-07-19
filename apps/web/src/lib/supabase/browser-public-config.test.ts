import { afterEach, describe, expect, it, vi } from 'vitest';

import { readBrowserSupabasePublicConfig } from './browser-public-config.js';

describe('readBrowserSupabasePublicConfig', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('从显式的 NEXT_PUBLIC 环境变量读取浏览器配置', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.test');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'public-key');

    expect(readBrowserSupabasePublicConfig()).toEqual({
      url: 'https://example.test',
      anonKey: 'public-key',
    });
  });
});
