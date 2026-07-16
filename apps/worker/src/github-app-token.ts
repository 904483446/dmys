type GitHubAppTokenDependencies = {
  createAppJwt: () => Promise<string>;
  fetch: (input: string, init?: RequestInit) => Promise<Response>;
};

export async function createGitHubInstallationToken(
  dependencies: GitHubAppTokenDependencies,
  installationId: number,
) {
  if (!Number.isSafeInteger(installationId) || installationId <= 0)
    throw new Error('GITHUB_INSTALLATION_TOKEN_UNAVAILABLE');
  const appJwt = await dependencies.createAppJwt();
  const response = await dependencies.fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${appJwt}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  );
  if (!response.ok) throw new Error('GITHUB_INSTALLATION_TOKEN_UNAVAILABLE');
  const body = (await response.json()) as { token?: unknown };
  if (typeof body.token !== 'string' || body.token.length === 0)
    throw new Error('GITHUB_INSTALLATION_TOKEN_UNAVAILABLE');
  return body.token;
}
