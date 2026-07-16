import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { createYauzlExtractor } from './yauzl-extractor.js';

function createEmptyZip(fileName: string) {
  const name = Buffer.from(fileName);
  const localHeader = Buffer.alloc(30);
  localHeader.writeUInt32LE(0x04034b50, 0);
  localHeader.writeUInt16LE(20, 4);
  localHeader.writeUInt16LE(name.length, 26);
  const centralDirectory = Buffer.alloc(46);
  centralDirectory.writeUInt32LE(0x02014b50, 0);
  centralDirectory.writeUInt16LE(20, 4);
  centralDirectory.writeUInt16LE(20, 6);
  centralDirectory.writeUInt16LE(name.length, 28);
  const centralOffset = localHeader.length + name.length;
  centralDirectory.writeUInt32LE(0, 42);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(1, 8);
  end.writeUInt16LE(1, 10);
  end.writeUInt32LE(centralDirectory.length + name.length, 12);
  end.writeUInt32LE(centralOffset, 16);
  return Buffer.concat([localHeader, name, centralDirectory, name, end]);
}

describe('createYauzlExtractor', () => {
  it('读取条目并仅解包到指定临时目录', async () => {
    const root = await mkdtemp(join(tmpdir(), 'vibeverify-yauzl-'));
    const archivePath = join(root, 'source.zip');
    const destination = join(root, 'project');
    try {
      await writeFile(archivePath, createEmptyZip('package.json'));
      const extractor = createYauzlExtractor();

      await expect(extractor.listEntries(archivePath)).resolves.toEqual(['package.json']);
      await extractor.extract(archivePath, destination);
      await expect(readFile(join(destination, 'package.json'))).resolves.toEqual(Buffer.alloc(0));
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });
});
