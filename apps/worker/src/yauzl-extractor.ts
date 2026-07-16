import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';
import * as yauzl from 'yauzl';

function openArchive(archivePath: string) {
  return new Promise<yauzl.ZipFile>((resolveArchive, reject) => {
    yauzl.open(
      archivePath,
      { autoClose: false, lazyEntries: true, validateEntrySizes: true },
      (error, archive) => {
        if (error !== null || archive === undefined) reject(new Error('ZIP_OPEN_FAILED'));
        else resolveArchive(archive);
      },
    );
  });
}

function readEntries(archive: yauzl.ZipFile) {
  return new Promise<yauzl.Entry[]>((resolveEntries, reject) => {
    const entries: yauzl.Entry[] = [];
    archive.on('entry', (entry: yauzl.Entry) => {
      entries.push(entry);
      archive.readEntry();
    });
    archive.once('end', () => {
      resolveEntries(entries);
    });
    archive.once('error', () => reject(new Error('ZIP_READ_FAILED')));
    archive.readEntry();
  });
}

function isSafeEntry(entry: yauzl.Entry, workspace: string) {
  if (entry.isEncrypted()) return false;
  const destination = resolve(workspace, entry.fileName);
  const relativePath = relative(workspace, destination);
  return (
    !isAbsolute(entry.fileName) &&
    relativePath !== '..' &&
    !relativePath.startsWith(`..\\`) &&
    !relativePath.startsWith('../')
  );
}

function openEntryStream(archive: yauzl.ZipFile, entry: yauzl.Entry) {
  return new Promise<NodeJS.ReadableStream>((resolveStream, reject) => {
    archive.openReadStream(entry, (error, stream) => {
      if (error !== null) reject(new Error('ZIP_READ_FAILED'));
      else resolveStream(stream);
    });
  });
}

export function createYauzlExtractor() {
  return {
    async listEntries(archivePath: string) {
      const archive = await openArchive(archivePath);
      try {
        return (await readEntries(archive)).map((entry) => entry.fileName);
      } finally {
        archive.close();
      }
    },
    async extract(archivePath: string, workspace: string) {
      const archive = await openArchive(archivePath);
      try {
        const entries = await readEntries(archive);
        for (const entry of entries) {
          if (!isSafeEntry(entry, workspace)) throw new Error('UNSAFE_ZIP_ENTRY');
          if (entry.fileName.endsWith('/')) continue;

          const destination = resolve(workspace, entry.fileName);
          await mkdir(dirname(destination), { recursive: true });
          await pipeline(await openEntryStream(archive, entry), createWriteStream(destination));
        }
      } finally {
        archive.close();
      }
    },
  };
}
