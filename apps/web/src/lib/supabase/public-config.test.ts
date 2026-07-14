import { describe, expect, it } from 'vitest';

import { readSupabasePublicConfig } from './public-config.js';

describe('readSupabasePublicConfig', () => {
  it('仅在 URL 与匿名密钥均存在时返回浏览器配置', () => {
    expect(readSupabasePublicConfig({})).toBeNull();
    expect(
      readSupabasePublicConfig({ NEXT_PUBLIC_SUPABASE_URL: 'https://example.test' }),
    ).toBeNull();
    expect(
      readSupabasePublicConfig({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.test',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-key',
      }),
    ).toEqual({ url: 'https://example.test', anonKey: 'public-key' });
  });
});
