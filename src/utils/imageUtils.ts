export function toCssVarName(fileName: string): string {
  const base = fileName
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `--img-${base}`;
}

export function toExportName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '');
  return base
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c: string) => c.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, '')
    .replace(/^(\d)/, '_$1');
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function baseName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '');
}
