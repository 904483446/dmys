type ExtractionDependencies = {
  listEntries: (archivePath: string) => Promise<string[]>;
  extract: (archivePath: string, destination: string) => Promise<void>;
};

function isSafeEntry(entry: string) {
  if (entry.length === 0 || entry.startsWith('/') || entry.startsWith('\\')) return false;
  return !entry
    .split(/[\\/]/)
    .some((part) => part === '..' || part === '.env' || part === '.git' || part === 'node_modules');
}

export async function extractZipSource(
  dependencies: ExtractionDependencies,
  archivePath: string,
  workspace: string,
) {
  const entries = await dependencies.listEntries(archivePath);
  if (!entries.every(isSafeEntry)) throw new Error('UNSAFE_ZIP_ENTRY');
  await dependencies.extract(archivePath, workspace);
}
