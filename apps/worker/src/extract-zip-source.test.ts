import { describe, expect, it, vi } from 'vitest';

import { extractZipSource } from './extract-zip-source.js';

describe('extractZipSource', () => {
  it('验证全部条目后才解包安全的 ZIP', async () => {
    const extract = vi.fn().mockResolvedValue(undefined);

    await extractZipSource(
      {
        listEntries: async () => ['package.json', 'src/main.ts'],
        extract,
      },
      'temporary-workspace\\source.zip',
      'temporary-workspace',
    );

    expect(extract).toHaveBeenCalledWith('temporary-workspace\\source.zip', 'temporary-workspace');
  });

  it('遇到敏感条目时不执行解包', async () => {
    const extract = vi.fn();

    await expect(
      extractZipSource(
        { listEntries: async () => ['.env'], extract },
        'temporary-workspace\\source.zip',
        'temporary-workspace',
      ),
    ).rejects.toThrow('UNSAFE_ZIP_ENTRY');

    expect(extract).not.toHaveBeenCalled();
  });
});
