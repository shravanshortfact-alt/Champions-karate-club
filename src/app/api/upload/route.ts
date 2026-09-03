export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { saveFileToDisk } from '@/lib/upload-store';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400, headers: corsHeaders });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || 'video/mp4';
    
    // Save buffer to disk / file route to keep URL tiny (< 50 chars) and prevent D1 SQL length limit errors
    const url = saveFileToDisk(buffer, file.name, mimeType);

    return NextResponse.json({ url }, { headers: corsHeaders });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to process file" }, { status: 500, headers: corsHeaders });
  }
}
