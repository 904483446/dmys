import { join } from 'node:path';

import { extractZipSource } from './extract-zip-source.js';
import { prepareZipSource } from './prepare-zip-source.js';

type PackageJson = { dependencies?: Record<string, string>; scripts?: Record<string, string> };
type PrepareZipProjectDependencies = {
  download: (storagePath: string) => Promise<Buffer>;
  writeFile: (path: string, content: Buffer) => Promise<void>;
  listEntries: (archivePath: string) => Promise<string[]>;
  extract: (archivePath: string, destination: string) => Promise<void>;
  readFile: (path: string) => Promise<string>;
};

function parsePackageJson(content: string): PackageJson {
  const parsed: unknown = JSON.parse(content);
  if (parsed === null || typeof parsed !== 'object') throw new Error('INVALID_PACKAGE_JSON');
  return parsed as PackageJson;
}

export async function prepareZipProject(
  dependencies: PrepareZipProjectDependencies,
  workspace: string,
  sourceStoragePath: string,
) {
  const { archivePath } = await prepareZipSource(dependencies, workspace, sourceStoragePath);
  await extractZipSource(dependencies, archivePath, workspace);
  const packageJsonEntries = (await dependencies.listEntries(archivePath)).filter(
    (entry) => entry === 'package.json' || entry.endsWith('/package.json'),
  );
  if (packageJsonEntries.length !== 1) throw new Error('INVALID_PROJECT_PACKAGE');
  const packageJsonEntry = packageJsonEntries[0];
  if (packageJsonEntry === undefined) throw new Error('INVALID_PROJECT_PACKAGE');
  const directoryPrefix = packageJsonEntry.slice(0, -'package.json'.length).replace(/\/$/, '');
  const projectDirectory =
    directoryPrefix.length === 0 ? workspace : join(workspace, ...directoryPrefix.split('/'));
  return {
    packageJson: parsePackageJson(
      await dependencies.readFile(join(projectDirectory, 'package.json')),
    ),
    projectDirectory,
  };
}
