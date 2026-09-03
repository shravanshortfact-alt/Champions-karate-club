export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { saveFileToDisk } from '@/lib/upload-store';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || 'application/octet-stream';

    // Save to disk and get small URL path (prevents 413 Payload Too Large on settings save)
    const fileUrl = saveFileToDisk(buffer, file.name, mimeType);

    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to process file" }, { status: 500 });
  }
}
