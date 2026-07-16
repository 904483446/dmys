type InstallationClient = {
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

export async function resolveGitHubInstallationId(
  client: InstallationClient,
  installationRecordId: string,
) {
  const { data, error } = await client
    .from('github_installations')
    .select('installation_id')
    .eq('id', installationRecordId)
    .is('revoked_at', null)
    .maybeSingle();
  if (
    error !== null ||
    data === null ||
    !Number.isSafeInteger(data.installation_id) ||
    data.installation_id <= 0
  )
    throw new Error('GITHUB_INSTALLATION_UNAVAILABLE');
  return data.installation_id;
}
