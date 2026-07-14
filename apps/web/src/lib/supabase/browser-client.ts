import { createBrowserClient } from '@supabase/ssr';

import { readSupabasePublicConfig } from './public-config';

export function createSupabaseBrowserClient() {
  const config = readSupabasePublicConfig(process.env);

  return config === null ? null : createBrowserClient(config.url, config.anonKey);
}
