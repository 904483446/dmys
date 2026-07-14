export function createOtpRedirectUrl(origin: string): string {
  return new URL('/auth/confirm', origin).toString();
}
