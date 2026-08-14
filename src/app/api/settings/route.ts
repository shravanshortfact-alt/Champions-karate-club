export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getSiteSettings, updateSiteSettings } from '@/lib/settings';

export async function GET() {
  const settings = await getSiteSettings();
  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  try {
    const newSettings = await request.json();
    await updateSiteSettings(newSettings);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API SETTINGS ERROR:", error);
    return NextResponse.json({ success: false, error: error?.message || String(error) || "Failed to save settings" }, { status: 500 });
  }
}

