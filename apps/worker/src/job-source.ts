type ZipJobSource = { type: 'zip'; sourceStoragePath: string };
type GitHubJobSource = {
  type: 'github';
  installationId: string;
  repositoryId: number;
  ref: string;
};

export type JobSource = ZipJobSource | GitHubJobSource;

export function parseJobSource(sourceSnapshot: unknown): JobSource {
  if (sourceSnapshot === null || typeof sourceSnapshot !== 'object')
    throw new Error('UNSUPPORTED_JOB_SOURCE');

  const snapshot = sourceSnapshot as Record<string, unknown>;
  if (typeof snapshot.sourceStoragePath === 'string' && snapshot.sourceStoragePath.length > 0)
    return { type: 'zip', sourceStoragePath: snapshot.sourceStoragePath };

  if (
    typeof snapshot.installationId === 'string' &&
    typeof snapshot.repositoryId === 'number' &&
    Number.isInteger(snapshot.repositoryId) &&
    typeof snapshot.ref === 'string' &&
    snapshot.ref.length > 0
  )
    return {
      type: 'github',
      installationId: snapshot.installationId,
      repositoryId: snapshot.repositoryId,
      ref: snapshot.ref,
    };

  throw new Error('UNSUPPORTED_JOB_SOURCE');
}
