type PackageJson = { dependencies?: Record<string, string>; scripts?: Record<string, string>; packageManager?: string };
type ProjectPlan = {
  framework: 'vite' | 'next';
  install: 'npm ci' | 'pnpm install --frozen-lockfile --prefer-offline';
  build: 'npm run build';
  start: 'npm run dev' | 'npm run start';
  localUrl: string;
};

export function createProjectPlan(packageJson: PackageJson, packageManager = packageJson.packageManager): ProjectPlan | null {
  const scripts = packageJson.scripts ?? {};
  const install = packageManager?.startsWith('pnpm') ? 'pnpm install --frozen-lockfile --prefer-offline' : 'npm ci';
  if (
    packageJson.dependencies?.vite !== undefined &&
    scripts.build === 'vite build' &&
    scripts.dev?.startsWith('vite ')
  )
    return {
      framework: 'vite',
      install,
      build: 'npm run build',
      start: 'npm run dev',
      localUrl: 'http://127.0.0.1:5173',
    };
  if (
    packageJson.dependencies?.next !== undefined &&
    scripts.build === 'next build' &&
    scripts.start?.startsWith('next start')
  )
    return {
      framework: 'next',
      install,
      build: 'npm run build',
      start: 'npm run start',
      localUrl: 'http://127.0.0.1:3000',
    };
  return null;
}

export function filterProjectFiles(paths: string[]) {
  return paths.filter(
    (path) =>
      !path
        .split('/')
        .some((part) => part === '.git' || part === 'node_modules' || part === '.env'),
  );
}
