import { getPrisma } from '@/lib/prisma';
import { saveBase64ToDisk } from '@/lib/upload-store';
import fs from 'fs';

const SETTINGS_KEY = 'site_settings';
const WORKER_SETTINGS_URL = 'https://karate-club.shravanshortfact.workers.dev/api/settings';

declare global {
  var __SITE_SETTINGS__: any;
}

const getTmpSettingsPath = () => {
  return '/tmp/site_settings.json';
};

function readFsSettings() {
  try {
    if (globalThis.__SITE_SETTINGS__) {
      return globalThis.__SITE_SETTINGS__;
    }
    const tmpPath = getTmpSettingsPath();
    if (fs.existsSync(tmpPath)) {
      const content = fs.readFileSync(tmpPath, 'utf8');
      const data = JSON.parse(content);
      globalThis.__SITE_SETTINGS__ = data;
      return data;
    }
  } catch (e) {
    // Ignore fs errors
  }
  return null;
}

function writeFsSettings(settings: any) {
  globalThis.__SITE_SETTINGS__ = settings;
  try {
    const tmpPath = getTmpSettingsPath();
    fs.writeFileSync(tmpPath, JSON.stringify(settings, null, 2), 'utf8');
  } catch (e) {
    console.warn("Could not write settings to /tmp:", e);
  }
}

export const defaultSettings = {
  upiId: 'championkarate@upi',
  logoUrl: '/logo.png',
  instagramLink: 'https://www.instagram.com/karate_king_no1?igsi=Zmt2aGxqcDJiemk2',
  whatsappNumber: '',
  instructors: [
    {
      name: 'Sensei Kenjiro',
      rank: '8th Dan Black Belt',
      experience: 'With over 30 years of martial arts experience, Sensei Kenjiro has trained national champions and international medalists.',
      photoUrl: '/instructor.png'
    }
  ],
  achievements: [
    '5x National Champion',
    'Gold Medalist - Asian Karate Championships',
    'Certified World Karate Federation Coach'
  ],
  videos: [
    {
      title: 'Training Sessions',
      url: ''
    },
    {
      title: 'Competition Highlights',
      url: ''
    }
  ],
  branches: [
    { name: "Downtown Main Dojo", qrCodeUrl: "" },
    { name: "Westside Academy", qrCodeUrl: "" },
    { name: "North Hills Training Center", qrCodeUrl: "" }
  ],
  registrationLinks: [
    { title: "Admission", description: "Join the academy", link: "/register/admission", fee: "2500", qrCodeUrl: "" },
    { title: "Belt Exam", description: "Register for grading", link: "/register/belt-exam", fee: "1500", qrCodeUrl: "" },
    { title: "Competition", description: "Enter upcoming events", link: "/register/competition", fee: "1000", qrCodeUrl: "" },
    { title: "Seminar", description: "Special training camps", link: "/register/seminar", fee: "2000", qrCodeUrl: "" },
    { title: "Fee Payment", description: "Pay your monthly fees", link: "/pay-fee", fee: "700", qrCodeUrl: "" }
  ],
  formLocks: {
    competition: false,
    seminar: false,
    beltExam: false
  }
};

export async function getSiteSettings() {
  let parsed: any = null;

  // 1. Try Cloudflare D1 global store (synced across all Vercel serverless instances worldwide)
  try {
    const res = await fetch(WORKER_SETTINGS_URL, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        parsed = data;
      }
    }
  } catch (e) {
    // Ignore worker fetch errors
  }

  // 2. Try Prisma DB if available
  if (!parsed) {
    try {
      const prisma = getPrisma();
      if (prisma && (prisma as any).systemSettings) {
        const record = await (prisma as any).systemSettings.findUnique({
          where: { key: SETTINGS_KEY }
        });

        if (record && record.value) {
          parsed = JSON.parse(record.value);
        }
      }
    } catch (error) {
      console.error("Failed to fetch settings from DB, using fallback store:", error);
    }
  }

  // 3. Fallback to /tmp / memory
  if (!parsed) {
    parsed = readFsSettings();
  }

  if (parsed) {
    // Migrate branches to objects
    if (parsed.branches && parsed.branches.length > 0 && typeof parsed.branches[0] === 'string') {
      parsed.branches = parsed.branches.map((b: string) => ({
        name: b,
        qrCodeUrl: ''
      }));
    } else if (!parsed.branches) {
      parsed.branches = [];
    }
    return { ...defaultSettings, ...parsed, logoUrl: '/logo.png' };
  }

  return { ...defaultSettings, logoUrl: '/logo.png' };
}

export async function updateSiteSettings(newSettings: any) {
  const existing = await getSiteSettings();
  const merged = { ...existing, ...newSettings, logoUrl: '/logo.png' };

  // Convert any Base64 video URLs to compact file paths to prevent 413 payload errors
  if (Array.isArray(merged.videos)) {
    merged.videos = merged.videos.map((v: any) => {
      if (v && typeof v.url === 'string' && v.url.startsWith('data:')) {
        return { ...v, url: saveBase64ToDisk(v.url) };
      }
      return v;
    });
  }

  // Always update in-memory / fs cache first
  writeFsSettings(merged);

  // Sync settings to Cloudflare D1 global store
  try {
    await fetch(WORKER_SETTINGS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(merged)
    });
  } catch (e) {
    console.error("Failed to sync settings to Cloudflare Worker:", e);
  }

  try {
    const prisma = getPrisma();
    if (prisma && (prisma as any).systemSettings) {
      await (prisma as any).systemSettings.upsert({
        where: { key: SETTINGS_KEY },
        update: { value: JSON.stringify(merged) },
        create: { id: 'site_settings_id', key: SETTINGS_KEY, value: JSON.stringify(merged) }
      });
    }
  } catch (error) {
    console.error("Failed to update settings in DB (using fallback store):", error);
  }

  return merged;
}
