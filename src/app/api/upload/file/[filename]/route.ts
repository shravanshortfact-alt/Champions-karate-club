export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getFilePathFromDisk } from '@/lib/upload-store';
import fs from 'fs';

// GET: Serve media file from Database or Disk
export async function GET(
  request: Request,
  context: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await context.params;

    // 1. Try fetching from Database (D1 / Prisma)
    try {
      const prisma = getPrisma();
      if (prisma && (prisma as any).systemSettings) {
        const record = await (prisma as any).systemSettings.findUnique({
          where: { key: filename }
        });

        if (record && record.value) {
          const { mimeType, base64 } = JSON.parse(record.value);
          const buffer = Buffer.from(base64, 'base64');
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': mimeType || 'video/mp4',
              'Cache-Control': 'public, max-age=31536000, immutable',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
      }
    } catch (e) {
      console.error("DB media fetch error:", e);
    }

    // 2. Fallback to Disk
    const fileInfo = getFilePathFromDisk(filename);
    if (fileInfo && fs.existsSync(fileInfo.filePath)) {
      const fileBuffer = fs.readFileSync(fileInfo.filePath);
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': fileInfo.mimeType,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    return new NextResponse('File not found', { status: 404 });
  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST: Direct endpoint to store media entry in Database
export async function POST(
  request: Request,
  context: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await context.params;
    const body = await request.json();

    const prisma = getPrisma();
    if (prisma && (prisma as any).systemSettings) {
      await (prisma as any).systemSettings.upsert({
        where: { key: filename },
        update: { value: JSON.stringify(body) },
        create: { id: filename, key: filename, value: JSON.stringify(body) }
      });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
