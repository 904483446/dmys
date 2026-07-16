type StorageClient = {
  storage: {
    from: (bucket: string) => {
      download: (path: string) => Promise<{ data: Blob | null; error: unknown | null }>;
    };
  };
};

export function createStorageZipDownloader(client: StorageClient) {
  return async (storagePath: string) => {
    const { data, error } = await client.storage.from('uploads').download(storagePath);
    if (error !== null || data === null) throw new Error('ZIP_SOURCE_DOWNLOAD_FAILED');
    return Buffer.from(await data.arrayBuffer());
  };
}
