export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getFilePathFromDisk } from '@/lib/upload-store';
import fs from 'fs';

export async function GET(
  request: Request,
  context: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await context.params;
    const fileInfo = getFilePathFromDisk(filename);

    if (!fileInfo) {
      return new NextResponse('File not found', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(fileInfo.filePath);
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': fileInfo.mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
