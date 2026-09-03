export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';
import { getSiteSettings, updateSiteSettings } from '@/lib/settings';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET() {
  try {
    const settings = await getSiteSettings();
    return NextResponse.json({ ...settings, _version: 'v3-cors-fix' }, {
      headers: corsHeaders,
    });
  } catch (err: any) {
    console.error("GET SETTINGS ERROR:", err);
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request: Request) {
  try {
    const newSettings = await request.json();
    const saved = await updateSiteSettings(newSettings);
    return NextResponse.json({ success: true, settings: saved, _version: 'v3-cors-fix' }, {
      headers: corsHeaders,
    });
  } catch (error: any) {
    const errText = error?.stack || error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
    console.error("API SETTINGS ERROR:", errText);
    return NextResponse.json(
      { success: false, error: errText, _version: 'v3-cors-fix' }, 
      { status: 500, headers: corsHeaders }
    );
  }
}
