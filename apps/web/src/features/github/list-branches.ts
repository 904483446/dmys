type GitHubBranch = { name: string; commit: { sha: string } };
type ListBranchesInput = {
  installationId: number;
  repositoryId: number;
  list: (installationId: number, repositoryId: number) => Promise<GitHubBranch[]>;
};

export async function listBranches(input: ListBranchesInput) {
  try {
    const branches = await input.list(input.installationId, input.repositoryId);
    return {
      ok: true as const,
      branches: branches.map((branch) => ({ name: branch.name, sha: branch.commit.sha })),
    };
  } catch {
    return {
      ok: false as const,
      code: 'GITHUB_BRANCHES_UNAVAILABLE',
      message: '暂时无法读取 GitHub 分支',
    };
  }
}
