type AccessActivationInput = { userId: string | null; isCodeValid: boolean };

export function decideAccessActivation(input: AccessActivationInput) {
  if (input.userId === null)
    return { ok: false as const, code: 'UNAUTHORIZED', message: '请先登录后再验证内测码' };
  if (!input.isCodeValid)
    return { ok: false as const, code: 'INVALID_BETA_ACCESS_CODE', message: '内测码无效或已失效' };

  return { ok: true as const };
}
