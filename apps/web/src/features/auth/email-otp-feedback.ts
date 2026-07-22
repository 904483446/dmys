export function getOtpSendErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const { message, status } = error as { message?: unknown; status?: unknown };
    if (
      status === 429 ||
      (typeof message === 'string' && /rate limit|too many|security purposes/i.test(message))
    ) {
      return '发送受限：当前测试环境每小时最多发送 2 封邮件，请稍后再试。';
    }
  }

  return '暂时无法发送登录链接，请稍后重试。';
}
