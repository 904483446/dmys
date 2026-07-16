import { createSign } from 'node:crypto';

type GitHubAppConfig = { appId: string; privateKey: string };

export function createGitHubAppJwt(
  config: GitHubAppConfig,
  nowSeconds = Math.floor(Date.now() / 1000),
) {
  if (config.appId.length === 0 || config.privateKey.length === 0)
    throw new Error('GITHUB_APP_CONFIGURATION_MISSING');
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({ iat: nowSeconds - 60, exp: nowSeconds + 9 * 60, iss: config.appId }),
  ).toString('base64url');
  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${payload}`);
  return `${header}.${payload}.${signer.sign(config.privateKey.replace(/\\n/g, '\n')).toString('base64url')}`;
}
