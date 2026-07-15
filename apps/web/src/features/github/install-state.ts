import { createHmac, timingSafeEqual } from 'node:crypto';

type InstallState = { userId: string; expiresAt: number; now: number; expectedUserId: string };
type SignedStateInput = { userId: string; now: number; secret: string; nonce: string };
type DecodeStateInput = { state: string; now: number; secret: string; expectedUserId: string };

export function consumeInstallState(input: InstallState) {
  if (input.expiresAt <= input.now || input.userId !== input.expectedUserId)
    return {
      ok: false as const,
      code: 'INVALID_GITHUB_INSTALLATION_STATE',
      message: 'GitHub 安装请求已失效，请重新发起连接',
    };
  return { ok: true as const };
}

export function createInstallState(input: SignedStateInput) {
  const payload = Buffer.from(
    JSON.stringify({ userId: input.userId, nonce: input.nonce, expiresAt: input.now + 10 * 60 }),
  ).toString('base64url');
  const signature = createHmac('sha256', input.secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function decodeInstallState(input: DecodeStateInput) {
  const [payload, signature, extra] = input.state.split('.');
  if (payload === undefined || signature === undefined || extra !== undefined)
    return invalidInstallState();
  const expectedSignature = createHmac('sha256', input.secret).update(payload).digest('base64url');
  if (!safeEqual(signature, expectedSignature)) return invalidInstallState();

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      userId?: unknown;
      expiresAt?: unknown;
    };
    if (typeof decoded.userId !== 'string' || typeof decoded.expiresAt !== 'number')
      return invalidInstallState();
    return consumeInstallState({
      userId: decoded.userId,
      expiresAt: decoded.expiresAt,
      now: input.now,
      expectedUserId: input.expectedUserId,
    });
  } catch {
    return invalidInstallState();
  }
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function invalidInstallState() {
  return {
    ok: false as const,
    code: 'INVALID_GITHUB_INSTALLATION_STATE',
    message: 'GitHub 安装请求已失效，请重新发起连接',
  };
}
