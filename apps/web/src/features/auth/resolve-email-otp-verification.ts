import type { EmailOtpType } from '@supabase/supabase-js';

const supportedTypes = new Set<EmailOtpType>([
  'email',
  'magiclink',
  'recovery',
  'invite',
  'email_change',
]);

export function resolveEmailOtpVerification(
  url: URL,
): { kind: 'code'; code: string } | { kind: 'otp'; tokenHash: string; type: EmailOtpType } | null {
  const code = url.searchParams.get('code');
  if (code !== null) return { kind: 'code', code };

  const tokenHash = url.searchParams.get('token_hash') ?? url.searchParams.get('token');
  const type = url.searchParams.get('type');

  if (tokenHash === null || type === null || !supportedTypes.has(type as EmailOtpType)) return null;

  return { kind: 'otp', tokenHash, type: type as EmailOtpType };
}
