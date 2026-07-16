import { parseJobSource } from './job-source.js';

type PreparedProject = { packageJson: object; projectDirectory: string };
type SourcePreparerDependencies = {
  zip: (workspace: string, sourceSnapshot: unknown) => Promise<PreparedProject>;
  github: (workspace: string, sourceSnapshot: unknown) => Promise<PreparedProject>;
};

export function createSourcePreparer(dependencies: SourcePreparerDependencies) {
  return (workspace: string, sourceSnapshot: unknown) => {
    const source = parseJobSource(sourceSnapshot);
    return source.type === 'zip'
      ? dependencies.zip(workspace, sourceSnapshot)
      : dependencies.github(workspace, sourceSnapshot);
  };
}
