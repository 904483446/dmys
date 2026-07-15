type GitHubRepository = { id: number; full_name: string; private: boolean; default_branch: string };
type ListRepositoriesInput = {
  installationId: number;
  list: (installationId: number) => Promise<GitHubRepository[]>;
};

export async function listRepositories(input: ListRepositoriesInput) {
  try {
    const repositories = await input.list(input.installationId);
    return {
      ok: true as const,
      repositories: repositories.map((repository) => ({
        id: repository.id,
        fullName: repository.full_name,
        private: repository.private,
        defaultBranch: repository.default_branch,
      })),
    };
  } catch {
    return {
      ok: false as const,
      code: 'GITHUB_REPOSITORIES_UNAVAILABLE',
      message: '暂时无法读取 GitHub 仓库',
    };
  }
}
