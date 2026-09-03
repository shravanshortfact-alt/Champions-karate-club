export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';
import { getSiteSettings, updateSiteSettings } from '@/lib/settings';

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET() {
  const settings = await getSiteSettings();
  return NextResponse.json(settings, {
    headers: noCacheHeaders,
  });
}

export async function POST(request: Request) {
  try {
    const newSettings = await request.json();
    const saved = await updateSiteSettings(newSettings);
    return NextResponse.json({ success: true, settings: saved }, {
      headers: noCacheHeaders,
    });
  } catch (error: any) {
    console.error("API SETTINGS ERROR:", error);
    return NextResponse.json(
      { success: false, error: error?.message || String(error) || "Failed to save settings" }, 
      { status: 500, headers: noCacheHeaders }
    );
  }
}

