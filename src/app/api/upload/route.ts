export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { saveFileToDisk } from '@/lib/upload-store';

const WORKER_MEDIA_URL = 'https://karate-club.shravanshortfact.workers.dev/api/upload/file';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || 'video/mp4';
    const base64 = buffer.toString('base64');
    const mediaId = `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const mediaObj = { mimeType, base64 };

    // 1. Save to Database (Prisma / D1)
    try {
      const prisma = getPrisma();
      if (prisma && (prisma as any).systemSettings) {
        await (prisma as any).systemSettings.upsert({
          where: { key: mediaId },
          update: { value: JSON.stringify(mediaObj) },
          create: { id: mediaId, key: mediaId, value: JSON.stringify(mediaObj) }
        });
      }
    } catch (e) {
      console.error("DB media save error:", e);
    }

    // 2. Also save to disk as fallback
    saveFileToDisk(buffer, `${mediaId}.mp4`, mimeType);

    // 3. Sync media directly to Cloudflare Worker D1 endpoint so it works globally
    try {
      await fetch(`${WORKER_MEDIA_URL}/${mediaId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mediaObj)
      });
    } catch (e) {
      console.error("Worker media sync error:", e);
    }

    // Return the clean media URL (small string, prevents 413 settings payload errors)
    return NextResponse.json({ url: `/api/upload/file/${mediaId}` });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to process file" }, { status: 500 });
  }
}
