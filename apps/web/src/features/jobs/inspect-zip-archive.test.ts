import { describe, expect, it } from 'vitest';

import { inspectZipArchive } from './inspect-zip-archive.js';

describe('inspectZipArchive', () => {
  it('拒绝不是 ZIP 的内容', async () => {
    await expect(inspectZipArchive(Buffer.from('not a zip'))).resolves.toMatchObject({
      ok: false,
      code: 'INVALID_ZIP',
    });
  });

  it('拒绝只有 ZIP 文件头的伪造内容', async () => {
    await expect(inspectZipArchive(Buffer.from([0x50, 0x4b, 0x03, 0x04]))).resolves.toMatchObject({
      ok: false,
      code: 'INVALID_ZIP',
    });
  });

  it('拒绝含路径穿越条目的 ZIP', async () => {
    await expect(inspectZipArchive(createStoredZip('../escape.txt'))).resolves.toMatchObject({
      ok: false,
      code: 'INVALID_ZIP',
    });
  });

  it.each(['.env', '.git/config', 'node_modules/a.js'])('拒绝受限目录 %s', async (fileName) => {
    await expect(inspectZipArchive(createStoredZip(fileName))).resolves.toMatchObject({
      ok: false,
      code: 'INVALID_ZIP',
    });
  });

  it('拒绝声明解压大小超过上限的 ZIP', async () => {
    await expect(
      inspectZipArchive(createStoredZip('large.txt', 100 * 1024 * 1024 + 1)),
    ).resolves.toMatchObject({
      ok: false,
      code: 'INVALID_ZIP',
    });
  });
});

function createStoredZip(fileName: string, uncompressedSize = 0) {
  const name = Buffer.from(fileName);
  const local = Buffer.alloc(30 + name.length);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(name.length, 26);
  name.copy(local, 30);

  const central = Buffer.alloc(46 + name.length);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(name.length, 28);
  central.writeUInt32LE(uncompressedSize, 24);
  name.copy(central, 46);

  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(1, 8);
  end.writeUInt16LE(1, 10);
  end.writeUInt32LE(central.length, 12);
  end.writeUInt32LE(local.length, 16);

  return Buffer.concat([local, central, end]);
}
