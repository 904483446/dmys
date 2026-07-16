import { parseJobSource } from './job-source.js';
import { prepareZipProject } from './prepare-zip-project.js';

type GitHubSourcePreparerDependencies = {
  resolveInstallationId: (installationRecordId: string) => Promise<number>;
  downloadArchive: (source: {
    installationId: number;
    repositoryId: number;
    ref: string;
  }) => Promise<Buffer>;
  writeFile: (path: string, content: Buffer) => Promise<void>;
  listEntries: (archivePath: string) => Promise<string[]>;
  extract: (archivePath: string, destination: string) => Promise<void>;
  readFile: (path: string) => Promise<string>;
};

export function createGitHubSourcePreparer(dependencies: GitHubSourcePreparerDependencies) {
  return async (workspace: string, sourceSnapshot: unknown) => {
    const source = parseJobSource(sourceSnapshot);
    if (source.type !== 'github') throw new Error('UNSUPPORTED_JOB_SOURCE');
    const installationId = await dependencies.resolveInstallationId(source.installationId);
    const archive = await dependencies.downloadArchive({
      installationId,
      repositoryId: source.repositoryId,
      ref: source.ref,
    });
    return prepareZipProject(
      { ...dependencies, download: async () => archive },
      workspace,
      'github-source.zip',
    );
  };
}
