import { describe, expect, it, vi } from 'vitest';

import { prepareZipProject } from './prepare-zip-project.js';

describe('prepareZipProject', () => {
  it('在安全解包后只读取 package.json 生成项目配置', async () => {
    const extract = vi.fn().mockResolvedValue(undefined);
    const result = await prepareZipProject(
      {
        download: async () => Buffer.from('zip-content'),
        writeFile: vi.fn().mockResolvedValue(undefined),
        listEntries: async () => ['package.json'],
        extract,
        readFile: async () =>
          JSON.stringify({
            dependencies: { vite: '^6.0.0' },
            scripts: { build: 'vite build', dev: 'vite --host 0.0.0.0' },
          }),
      },
      'temporary-workspace',
      'user-id/upload-id/source.zip',
    );

    expect(result).toEqual({
      packageJson: {
        dependencies: { vite: '^6.0.0' },
        scripts: { build: 'vite build', dev: 'vite --host 0.0.0.0' },
      },
      projectDirectory: 'temporary-workspace',
    });
    expect(extract).toHaveBeenCalledWith('temporary-workspace\\source.zip', 'temporary-workspace');
  });

  it('识别归档中的唯一顶层项目目录', async () => {
    const readFile = vi.fn().mockResolvedValue(
      JSON.stringify({
        dependencies: { vite: '^6.0.0' },
        scripts: { build: 'vite build', dev: 'vite' },
      }),
    );

    await expect(
      prepareZipProject(
        {
          download: async () => Buffer.from('zip-content'),
          writeFile: vi.fn().mockResolvedValue(undefined),
          listEntries: async () => ['generated-root/package.json'],
          extract: vi.fn().mockResolvedValue(undefined),
          readFile,
        },
        'temporary-workspace',
        'source.zip',
      ),
    ).resolves.toEqual(
      expect.objectContaining({ projectDirectory: 'temporary-workspace\\generated-root' }),
    );
    expect(readFile).toHaveBeenCalledWith('temporary-workspace\\generated-root\\package.json');
  });
});
