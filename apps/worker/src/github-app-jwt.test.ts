import { generateKeyPairSync } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { createGitHubAppJwt } from './github-app-jwt.js';

describe('createGitHubAppJwt', () => {
  it('使用运行时私钥创建短期 App JWT', () => {
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const jwt = createGitHubAppJwt(
      { appId: '123', privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString() },
      1_000,
    );
    const [, encodedPayload] = jwt.split('.');
    const payload = JSON.parse(Buffer.from(encodedPayload ?? '', 'base64url').toString('utf8')) as {
      iss: string;
      exp: number;
    };

    expect(payload).toEqual(expect.objectContaining({ iss: '123', exp: 1_540 }));
  });
});
