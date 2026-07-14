import { NextResponse } from 'next/server';

import { resolveEmailOtpVerification } from '../../../features/auth/resolve-email-otp-verification';
import { createSupabaseServerClient } from '../../../lib/supabase/server-client';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const verification = resolveEmailOtpVerification(url);
  if (verification === null)
    return NextResponse.redirect(new URL('/login?error=invalid_link', url.origin));

  const supabase = await createSupabaseServerClient();
  if (supabase === null)
    return NextResponse.redirect(new URL('/login?error=unavailable', url.origin));
  const { error } =
    verification.kind === 'code'
      ? await supabase.auth.exchangeCodeForSession(verification.code)
      : await supabase.auth.verifyOtp({
          token_hash: verification.tokenHash,
          type: verification.type,
        });
  return NextResponse.redirect(
    new URL(error === null ? '/reports' : '/login?error=expired_link', url.origin),
  );
}
