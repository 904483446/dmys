import { createBrowserClient } from '@supabase/ssr';

import { readBrowserSupabasePublicConfig } from './browser-public-config';

export function createSupabaseBrowserClient() {
  const config = readBrowserSupabasePublicConfig();

  return config === null ? null : createBrowserClient(config.url, config.anonKey);
}
