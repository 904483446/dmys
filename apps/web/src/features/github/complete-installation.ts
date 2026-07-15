type CompleteInstallationInput = {
  state: string;
  userId: string;
  installationId: number;
  accountLogin: string;
  verifyState: (state: string, userId: string) => { ok: boolean };
  upsert: (installation: {
    userId: string;
    installationId: number;
    accountLogin: string;
  }) => Promise<{ error: unknown }>;
};

export async function completeInstallation(input: CompleteInstallationInput) {
  if (!input.verifyState(input.state, input.userId).ok)
    return {
      ok: false as const,
      code: 'INVALID_GITHUB_INSTALLATION_STATE',
      message: 'GitHub 安装请求已失效，请重新发起连接',
    };
  const { error } = await input.upsert({
    userId: input.userId,
    installationId: input.installationId,
    accountLogin: input.accountLogin,
  });
  if (error !== null)
    return {
      ok: false as const,
      code: 'GITHUB_INSTALLATION_SAVE_FAILED',
      message: '暂时无法保存 GitHub 授权',
    };
  return { ok: true as const };
}
