import { createSign } from 'node:crypto';

type GitHubFetch = (input: string, init?: RequestInit) => Promise<Response>;
type AppJwtFactory = () => Promise<string>;
type ClientDependencies = { fetch?: GitHubFetch; createAppJwt?: AppJwtFactory };
type GitHubRepository = { id: number; full_name: string; private: boolean; default_branch: string };
type GitHubBranch = { name: string; commit: { sha: string } };

export async function getInstallationAccountLogin(
  installationId: number,
  dependencies: ClientDependencies = {},
) {
  if (!Number.isSafeInteger(installationId) || installationId <= 0) return lookupFailed();

  try {
    const appJwt = await (dependencies.createAppJwt ?? createAppJwt)();
    const response = await (dependencies.fetch ?? fetch)(
      `https://api.github.com/app/installations/${installationId}`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${appJwt}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    );
    if (!response.ok) return lookupFailed();
    const body = (await response.json()) as { account?: { login?: unknown } };
    if (typeof body.account?.login !== 'string' || body.account.login.length === 0)
      return lookupFailed();
    return { ok: true as const, accountLogin: body.account.login };
  } catch {
    return lookupFailed();
  }
}

export async function listInstallationRepositories(
  installationId: number,
  dependencies: ClientDependencies = {},
) {
  if (!Number.isSafeInteger(installationId) || installationId <= 0)
    throw new Error('GITHUB_REPOSITORIES_UNAVAILABLE');

  const request = dependencies.fetch ?? fetch;
  const appJwt = await (dependencies.createAppJwt ?? createAppJwt)();
  const tokenResponse = await request(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: 'POST',
      headers: githubHeaders(appJwt),
    },
  );
  if (!tokenResponse.ok) throw new Error('GITHUB_REPOSITORIES_UNAVAILABLE');
  const tokenBody = (await tokenResponse.json()) as { token?: unknown };
  if (typeof tokenBody.token !== 'string' || tokenBody.token.length === 0)
    throw new Error('GITHUB_REPOSITORIES_UNAVAILABLE');

  const repositoriesResponse = await request('https://api.github.com/installation/repositories', {
    headers: githubHeaders(tokenBody.token),
  });
  if (!repositoriesResponse.ok) throw new Error('GITHUB_REPOSITORIES_UNAVAILABLE');
  const body = (await repositoriesResponse.json()) as { repositories?: unknown };
  if (!Array.isArray(body.repositories)) throw new Error('GITHUB_REPOSITORIES_UNAVAILABLE');
  return body.repositories.filter(isRepository);
}

export async function listInstallationBranches(
  installationId: number,
  repositoryId: number,
  dependencies: ClientDependencies = {},
) {
  if (!Number.isSafeInteger(repositoryId) || repositoryId <= 0)
    throw new Error('GITHUB_BRANCHES_UNAVAILABLE');

  const request = dependencies.fetch ?? fetch;
  const token = await createInstallationToken(
    installationId,
    request,
    dependencies.createAppJwt ?? createAppJwt,
  );
  const response = await request(`https://api.github.com/repositories/${repositoryId}/branches`, {
    headers: githubHeaders(token),
  });
  if (!response.ok) throw new Error('GITHUB_BRANCHES_UNAVAILABLE');
  const body = (await response.json()) as unknown;
  if (!Array.isArray(body)) throw new Error('GITHUB_BRANCHES_UNAVAILABLE');
  return body.filter(isBranch);
}

async function createAppJwt() {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
  if (
    appId === undefined ||
    appId.length === 0 ||
    privateKey === undefined ||
    privateKey.length === 0
  )
    throw new Error('GITHUB_APP_CONFIGURATION_MISSING');

  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({ iat: now - 60, exp: now + 9 * 60, iss: appId }),
  ).toString('base64url');
  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${payload}`);
  return `${header}.${payload}.${signer.sign(privateKey.replace(/\\n/g, '\n')).toString('base64url')}`;
}

function lookupFailed() {
  return {
    ok: false as const,
    code: 'GITHUB_INSTALLATION_LOOKUP_FAILED',
    message: '无法确认 GitHub 安装信息',
  };
}

function githubHeaders(token: string) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function createInstallationToken(
  installationId: number,
  request: GitHubFetch,
  getAppJwt: AppJwtFactory,
) {
  if (!Number.isSafeInteger(installationId) || installationId <= 0)
    throw new Error('GITHUB_INSTALLATION_TOKEN_UNAVAILABLE');
  const appJwt = await getAppJwt();
  const response = await request(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: 'POST',
      headers: githubHeaders(appJwt),
    },
  );
  if (!response.ok) throw new Error('GITHUB_INSTALLATION_TOKEN_UNAVAILABLE');
  const body = (await response.json()) as { token?: unknown };
  if (typeof body.token !== 'string' || body.token.length === 0)
    throw new Error('GITHUB_INSTALLATION_TOKEN_UNAVAILABLE');
  return body.token;
}

function isRepository(value: unknown): value is GitHubRepository {
  if (typeof value !== 'object' || value === null) return false;
  const repository = value as Record<string, unknown>;
  return (
    typeof repository.id === 'number' &&
    typeof repository.full_name === 'string' &&
    typeof repository.private === 'boolean' &&
    typeof repository.default_branch === 'string'
  );
}

function isBranch(value: unknown): value is GitHubBranch {
  if (typeof value !== 'object' || value === null) return false;
  const branch = value as { name?: unknown; commit?: { sha?: unknown } };
  return typeof branch.name === 'string' && typeof branch.commit?.sha === 'string';
}
