export const OTP_RESEND_COOLDOWN_SECONDS = 60;

export function getOtpSendErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const { message, status } = error as { message?: unknown; status?: unknown };
    if (
      status === 429 ||
      (typeof message === 'string' && /rate limit|too many|security purposes/i.test(message))
    ) {
      return '发送过于频繁，请 1 分钟后再试。';
    }
  }

  return '暂时无法发送验证码，请稍后重试。';
}
