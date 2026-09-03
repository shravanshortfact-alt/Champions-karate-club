import { getPrisma } from '@/lib/prisma';
import fs from 'fs';

const SETTINGS_KEY = 'site_settings';

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
  logoUrl: '',
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
    return { ...defaultSettings, ...parsed };
  }

  return defaultSettings;
}

export async function updateSiteSettings(newSettings: any) {
  const existing = await getSiteSettings();
  const merged = { ...existing, ...newSettings };

  // Always update in-memory / fs cache first
  writeFsSettings(merged);

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
    // Fallback store saved it successfully, do not fail the request!
  }

  return merged;
}
