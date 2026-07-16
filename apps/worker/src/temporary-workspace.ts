import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

type WorkspaceDependencies = {
  create: () => Promise<string>;
  remove: (path: string) => Promise<void>;
};

const defaultDependencies: WorkspaceDependencies = {
  create: () => mkdtemp(join(tmpdir(), 'vibeverify-')),
  remove: (path) => rm(path, { force: true, recursive: true }),
};

export async function withTemporaryWorkspace<T>(
  dependencies: WorkspaceDependencies,
  run: (path: string) => Promise<T>,
) {
  const path = await dependencies.create();
  try {
    return await run(path);
  } finally {
    await dependencies.remove(path);
  }
}

export function withDefaultTemporaryWorkspace<T>(run: (path: string) => Promise<T>) {
  return withTemporaryWorkspace(defaultDependencies, run);
}
