import { getPrisma } from '@/lib/prisma';
import { saveBase64ToDisk } from '@/lib/upload-store';
import fs from 'fs';

const SETTINGS_KEY = 'site_settings';
const WORKER_SETTINGS_URL = 'https://karate-club.shravanshortfact.workers.dev/api/settings';

declare global {
  var __SITE_SETTINGS__: any;
}

function getD1Binding(): any {
  try {
    const opennext = require('@opennextjs/cloudflare');
    const env = opennext?.getCloudflareContext?.()?.env;
    if (env && env.DB) {
      return env.DB;
    }
  } catch (e) {}

  try {
    if (typeof process !== 'undefined' && (process.env as any)?.DB) {
      return (process.env as any).DB;
    }
    if (typeof globalThis !== 'undefined' && (globalThis as any)?.DB) {
      return (globalThis as any).DB;
    }
    if (typeof globalThis !== 'undefined' && (globalThis as any)?.__env__?.DB) {
      return (globalThis as any).__env__.DB;
    }
  } catch (e) {
    // Ignore error
  }
  return null;
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
    admission: false,
    competition: false,
    seminar: false,
    beltExam: false
  }
};

export async function getSiteSettings() {
  let parsed: any = null;

  // 1. Direct D1 Binding Read (for Cloudflare Worker execution)
  const d1 = getD1Binding();
  if (d1) {
    try {
      const row: any = await d1.prepare("SELECT value FROM SystemSettings WHERE key = ?").bind(SETTINGS_KEY).first();
      if (row && row.value && row.value !== '{}') {
        const d1Data = JSON.parse(row.value);
        if (d1Data && typeof d1Data === 'object' && Object.keys(d1Data).length > 0) {
          parsed = d1Data;
        }
      }
    } catch (e) {
      console.error("D1 direct read error:", e);
    }
  }

  // 2. Try Cloudflare D1 global HTTP store (synced across all Vercel serverless instances worldwide)
  if (!parsed) {
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
  }

  // 3. Try Prisma DB if available
  try {
    const prisma = getPrisma();
    if (prisma && (prisma as any).systemSettings) {
      const record = await (prisma as any).systemSettings.findUnique({
        where: { key: SETTINGS_KEY }
      });

      if (record && record.value && record.value !== '{}') {
        const prismaSettings = JSON.parse(record.value);
        if (prismaSettings && typeof prismaSettings === 'object' && Object.keys(prismaSettings).length > 0) {
          if (parsed) {
            const mergedFormLocks = {
              ...(parsed.formLocks || {}),
              ...(prismaSettings.formLocks || {})
            };
            parsed = { ...parsed, ...prismaSettings, formLocks: mergedFormLocks };
          } else {
            parsed = prismaSettings;
          }
        }
      }
    }
  } catch (error) {
    console.error("Failed to fetch settings from DB, using fallback store:", error);
  }

  // 4. Fallback to /tmp / memory
  const fsSettings = readFsSettings();
  if (fsSettings) {
    if (parsed) {
      const mergedFormLocks = {
        ...(parsed.formLocks || {}),
        ...(fsSettings.formLocks || {})
      };
      parsed = { ...parsed, ...fsSettings, formLocks: mergedFormLocks };
    } else {
      parsed = fsSettings;
    }
  }

  const finalLocks = {
    ...defaultSettings.formLocks,
    ...(parsed?.formLocks || {})
  };

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
    return { ...defaultSettings, ...parsed, formLocks: finalLocks, logoUrl: '/logo.png' };
  }

  return { ...defaultSettings, formLocks: finalLocks, logoUrl: '/logo.png' };
}

export async function updateSiteSettings(newSettings: any) {
  const existing = await getSiteSettings();

  const mergedFormLocks = {
    ...defaultSettings.formLocks,
    ...(existing.formLocks || {}),
    ...(newSettings.formLocks || {})
  };

  const merged = { 
    ...existing, 
    ...newSettings, 
    formLocks: mergedFormLocks, 
    logoUrl: '/logo.png' 
  };

  // Sanitize any large base64 video or image URLs to file URLs to prevent D1 payload errors
  if (merged.videos && Array.isArray(merged.videos)) {
    merged.videos = merged.videos.map((v: any) => {
      if (v && v.url && typeof v.url === 'string' && v.url.startsWith('data:')) {
        return { ...v, url: saveBase64ToDisk(v.url) };
      }
      return v;
    });
  }

  if (merged.instructors && Array.isArray(merged.instructors)) {
    merged.instructors = merged.instructors.map((ins: any) => {
      if (ins && ins.photoUrl && typeof ins.photoUrl === 'string' && ins.photoUrl.startsWith('data:')) {
        return { ...ins, photoUrl: saveBase64ToDisk(ins.photoUrl) };
      }
      return ins;
    });
  }

  // Always update in-memory / fs cache first
  writeFsSettings(merged);

  // 1. Direct D1 Binding Update (for Cloudflare Worker execution)
  const d1 = getD1Binding();
  if (d1) {
    try {
      await d1.prepare("INSERT INTO SystemSettings (id, key, value) VALUES ('site_settings_id', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
        .bind(SETTINGS_KEY, JSON.stringify(merged))
        .run();
    } catch (e) {
      console.error("D1 direct write error:", e);
    }
  }

  // 2. Sync settings to Cloudflare D1 global store HTTP endpoint
  try {
    if (!d1) {
      await fetch(WORKER_SETTINGS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged)
      });
    }
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

