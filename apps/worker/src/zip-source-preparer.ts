import { parseJobSource } from './job-source.js';
import { prepareZipProject } from './prepare-zip-project.js';

type ZipSourcePreparerDependencies = {
  download: (storagePath: string) => Promise<Buffer>;
  writeFile: (path: string, content: Buffer) => Promise<void>;
  listEntries: (archivePath: string) => Promise<string[]>;
  extract: (archivePath: string, destination: string) => Promise<void>;
  readFile: (path: string) => Promise<string>;
};

export function createZipSourcePreparer(dependencies: ZipSourcePreparerDependencies) {
  return async (workspace: string, sourceSnapshot: unknown) => {
    const source = parseJobSource(sourceSnapshot);
    if (source.type !== 'zip') throw new Error('UNSUPPORTED_JOB_SOURCE');
    return prepareZipProject(dependencies, workspace, source.sourceStoragePath);
  };
}
