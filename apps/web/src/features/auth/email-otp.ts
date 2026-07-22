type EmailMagicLinkAuth = {
  signInWithOtp(credentials: {
    email: string;
    options: { emailRedirectTo: string };
  }): Promise<{ error: unknown | null }>;
};

export function requestEmailOtp({
  email,
  redirectTo,
  auth,
}: {
  email: string;
  redirectTo: string;
  auth: EmailMagicLinkAuth;
}) {
  return auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
}
