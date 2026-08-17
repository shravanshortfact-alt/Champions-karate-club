export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';


export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Convert to base64
    const base64String = buffer.toString('base64');
    const mimeType = file.type || 'image/jpeg';
    const dataUri = `data:${mimeType};base64,${base64String}`;

    // Return the base64 string directly as the URL
    return NextResponse.json({ url: dataUri });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to process file" }, { status: 500 });
  }
}
