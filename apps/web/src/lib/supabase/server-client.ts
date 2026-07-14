import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { readSupabasePublicConfig } from './public-config';

export async function createSupabaseServerClient() {
  const config = readSupabasePublicConfig(process.env);
  if (config === null) return null;

  const cookieStore = await cookies();
  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => {
        try {
          items.forEach((item) => cookieStore.set(item.name, item.value, item.options));
        } catch {
          /* Server Components cannot write cookies. */
        }
      },
    },
  });
}
