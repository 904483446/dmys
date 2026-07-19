type EmailOtpAuth = {
  signInWithOtp(credentials: { email: string }): Promise<{ error: unknown | null }>;
  verifyOtp(credentials: {
    email: string;
    token: string;
    type: 'email';
  }): Promise<{ error: unknown | null }>;
};

export function requestEmailOtp({
  email,
  auth,
}: {
  email: string;
  auth: Pick<EmailOtpAuth, 'signInWithOtp'>;
}) {
  return auth.signInWithOtp({ email });
}

export function verifyEmailOtp({
  email,
  token,
  auth,
}: {
  email: string;
  token: string;
  auth: Pick<EmailOtpAuth, 'verifyOtp'>;
}) {
  return auth.verifyOtp({ email, token, type: 'email' });
}
