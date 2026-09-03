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
  try {
    const settings = await getSiteSettings();
    return NextResponse.json({ ...settings, _version: 'v2-fix-lock-check' }, {
      headers: noCacheHeaders,
    });
  } catch (err: any) {
    console.error("GET SETTINGS ERROR:", err);
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500, headers: noCacheHeaders });
  }
}

export async function POST(request: Request) {
  try {
    const newSettings = await request.json();
    const saved = await updateSiteSettings(newSettings);
    return NextResponse.json({ success: true, settings: saved, _version: 'v2-fix-lock-check' }, {
      headers: noCacheHeaders,
    });
  } catch (error: any) {
    const errText = error?.stack || error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
    console.error("API SETTINGS ERROR:", errText);
    return NextResponse.json(
      { success: false, error: errText, _version: 'v2-fix-lock-check' }, 
      { status: 500, headers: noCacheHeaders }
    );
  }
}
