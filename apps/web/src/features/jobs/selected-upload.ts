export function describeSelectedUpload(file: { name: string; size: number }) {
  return `已选择：${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB`;
}
