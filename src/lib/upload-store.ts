import fs from 'fs';
import path from 'path';

export function saveFileToDisk(buffer: Buffer, originalFilename: string, mimeType: string): string {
  const sanitizeName = (originalFilename || 'file').replace(/[^a-zA-Z0-9.-]/g, '_');
  const filename = `${Date.now()}_${sanitizeName}`;

  // 1. Try public/uploads (works on local dev and standard servers)
  try {
    const publicDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    const publicPath = path.join(publicDir, filename);
    fs.writeFileSync(publicPath, buffer);
    return `/uploads/${filename}`;
  } catch (e) {
    // Read-only filesystem on Vercel / serverless
  }

  // 2. Fallback to /tmp/uploads for Vercel / serverless runtime
  try {
    const tmpDir = path.join('/tmp', 'uploads');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const tmpPath = path.join(tmpDir, filename);
    fs.writeFileSync(tmpPath, buffer);
    return `/api/upload/file/${filename}`;
  } catch (e) {
    console.error("Failed to write upload file to /tmp/uploads:", e);
  }

  // 3. Last fallback: base64
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

export function saveBase64ToDisk(dataUri: string): string {
  if (!dataUri || !dataUri.startsWith('data:')) return dataUri;

  try {
    const matches = dataUri.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) return dataUri;

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    let ext = '.bin';
    if (mimeType.includes('mp4')) ext = '.mp4';
    else if (mimeType.includes('webm')) ext = '.webm';
    else if (mimeType.includes('png')) ext = '.png';
    else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = '.jpg';

    return saveFileToDisk(buffer, `converted${ext}`, mimeType);
  } catch (e) {
    console.error("Failed to convert base64 to disk file:", e);
  }

  return dataUri;
}

export function getFilePathFromDisk(filename: string): { filePath: string; mimeType: string } | null {
  const safeFilename = path.basename(filename);
  
  const publicPath = path.join(process.cwd(), 'public', 'uploads', safeFilename);
  if (fs.existsSync(publicPath)) {
    return { filePath: publicPath, mimeType: getMimeType(safeFilename) };
  }

  const tmpPath = path.join('/tmp', 'uploads', safeFilename);
  if (fs.existsSync(tmpPath)) {
    return { filePath: tmpPath, mimeType: getMimeType(safeFilename) };
  }

  return null;
}

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.mp4') return 'video/mp4';
  if (ext === '.webm') return 'video/webm';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.svg') return 'image/svg+xml';
  return 'application/octet-stream';
}
