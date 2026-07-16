import { join } from 'node:path';

type ZipSourceDependencies = {
  download: (storagePath: string) => Promise<Buffer>;
  writeFile: (path: string, content: Buffer) => Promise<void>;
};

export async function prepareZipSource(
  dependencies: ZipSourceDependencies,
  workspace: string,
  sourceStoragePath: string,
) {
  const archivePath = join(workspace, 'source.zip');
  await dependencies.writeFile(archivePath, await dependencies.download(sourceStoragePath));
  return { archivePath };
}
