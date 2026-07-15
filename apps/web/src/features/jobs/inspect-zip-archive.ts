export async function inspectZipArchive(buffer: Buffer) {
  const hasZipHeader =
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07) &&
    (buffer[3] === 0x04 || buffer[3] === 0x06 || buffer[3] === 0x08);

  const hasEndOfCentralDirectory =
    buffer.length >= 22 &&
    buffer[buffer.length - 22] === 0x50 &&
    buffer[buffer.length - 21] === 0x4b &&
    buffer[buffer.length - 20] === 0x05 &&
    buffer[buffer.length - 19] === 0x06;

  if (!hasZipHeader || !hasEndOfCentralDirectory)
    return { ok: false as const, code: 'INVALID_ZIP', message: '上传文件不是有效的 ZIP 文件' };

  if (buffer.includes(Buffer.from('../')) || buffer.includes(Buffer.from('..\\')))
    return { ok: false as const, code: 'INVALID_ZIP', message: 'ZIP 包含不安全路径' };

  const entryCount = buffer.readUInt16LE(buffer.length - 14);
  const directoryOffset = buffer.readUInt32LE(buffer.length - 6);
  let offset = directoryOffset;
  let uncompressedBytes = 0;

  if (entryCount > 10_000 || directoryOffset >= buffer.length)
    return { ok: false as const, code: 'INVALID_ZIP', message: 'ZIP 文件目录不安全' };

  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== 0x02014b50)
      return { ok: false as const, code: 'INVALID_ZIP', message: 'ZIP 文件目录无效' };
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const entrySize = 46 + nameLength + extraLength + commentLength;
    if (offset + entrySize > buffer.length)
      return { ok: false as const, code: 'INVALID_ZIP', message: 'ZIP 文件目录无效' };
    const fileName = buffer.toString('utf8', offset + 46, offset + 46 + nameLength);
    const size = buffer.readUInt32LE(offset + 24);
    if (
      fileName.startsWith('/') ||
      fileName.startsWith('\\') ||
      fileName.split(/[\\/]/).includes('..') ||
      fileName.split(/[\\/]/).some((part) => ['.env', '.git', 'node_modules'].includes(part)) ||
      size > 100 * 1024 * 1024 ||
      uncompressedBytes + size > 500 * 1024 * 1024
    )
      return { ok: false as const, code: 'INVALID_ZIP', message: 'ZIP 包含不安全内容' };
    uncompressedBytes += size;
    offset += entrySize;
  }

  return { ok: true as const, fileCount: entryCount, uncompressedBytes };
}
