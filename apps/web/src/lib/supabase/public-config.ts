export type SupabasePublicConfig = { url: string; anonKey: string };

export function readSupabasePublicConfig(
  environment: Record<string, string | undefined>,
): SupabasePublicConfig | null {
  const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey } = environment;

  return url !== undefined && anonKey !== undefined ? { url, anonKey } : null;
}
