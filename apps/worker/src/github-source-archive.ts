type GitHubArchiveDependencies = {
  createInstallationToken: (installationId: number) => Promise<string>;
  fetch: (input: string, init?: RequestInit) => Promise<Response>;
};

type GitHubArchiveSource = { installationId: number; repositoryId: number; ref: string };

export async function downloadGitHubSourceArchive(
  dependencies: GitHubArchiveDependencies,
  source: GitHubArchiveSource,
) {
  const token = await dependencies.createInstallationToken(source.installationId);
  const response = await dependencies.fetch(
    `https://api.github.com/repositories/${source.repositoryId}/zipball/${encodeURIComponent(source.ref)}`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  );
  if (!response.ok) throw new Error('GITHUB_SOURCE_DOWNLOAD_FAILED');
  return Buffer.from(await response.arrayBuffer());
}
