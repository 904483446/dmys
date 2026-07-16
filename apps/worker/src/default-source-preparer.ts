import { readFile, writeFile } from 'node:fs/promises';

import { createGitHubAppJwt } from './github-app-jwt.js';
import { createGitHubInstallationToken } from './github-app-token.js';
import { resolveGitHubInstallationId } from './github-installation-resolver.js';
import { downloadGitHubSourceArchive } from './github-source-archive.js';
import { createGitHubSourcePreparer } from './github-source-preparer.js';
import { createSourcePreparer } from './source-preparer.js';
import { createStorageZipDownloader } from './storage-zip-downloader.js';
import { createYauzlExtractor } from './yauzl-extractor.js';
import { createZipSourcePreparer } from './zip-source-preparer.js';

type WorkerSourceClient = {
  storage: {
    from: (bucket: string) => {
      download: (path: string) => Promise<{ data: Blob | null; error: unknown | null }>;
    };
  };
  from: (table: 'github_installations') => {
    select: (columns: 'installation_id') => {
      eq: (
        column: 'id',
        value: string,
      ) => {
        is: (
          column: 'revoked_at',
          value: null,
        ) => {
          maybeSingle: () => Promise<{
            data: { installation_id: number } | null;
            error: unknown | null;
          }>;
        };
      };
    };
  };
};

export function createDefaultSourcePreparer(
  client: WorkerSourceClient,
  github: { appId: string; privateKey: string } | null,
) {
  const archive = createYauzlExtractor();
  const common = { writeFile, readFile, ...archive };
  const zip = createZipSourcePreparer({ ...common, download: createStorageZipDownloader(client) });
  const githubSource = async (workspace: string, sourceSnapshot: unknown) => {
    if (github === null) throw new Error('GITHUB_APP_CONFIGURATION_MISSING');
    return createGitHubSourcePreparer({
      ...common,
      resolveInstallationId: (recordId) => resolveGitHubInstallationId(client, recordId),
      downloadArchive: (source) =>
        downloadGitHubSourceArchive(
          {
            createInstallationToken: (installationId) =>
              createGitHubInstallationToken(
                { createAppJwt: async () => createGitHubAppJwt(github), fetch },
                installationId,
              ),
            fetch,
          },
          source,
        ),
    })(workspace, sourceSnapshot);
  };
  return createSourcePreparer({ zip, github: githubSource });
}
