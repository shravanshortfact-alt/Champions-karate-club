import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

const SETTINGS_KEY = 'site_settings';

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
  try {
    // Attempt to create table if it doesn't exist (failsafe for Vercel)
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "SystemSettings" (
            "id" TEXT NOT NULL,
            "key" TEXT NOT NULL,
            "value" TEXT NOT NULL,
            CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "SystemSettings_key_key" ON "SystemSettings"("key");
      `);
    } catch (e) {
      console.log("Table creation check skipped/failed");
    }

    const record = await prisma.systemSettings.findUnique({
      where: { key: SETTINGS_KEY }
    });

    if (record && record.value) {
      const parsed = JSON.parse(record.value);
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
  } catch (error) {
    console.error("Failed to fetch settings from DB:", error);
  }
  
  return defaultSettings;
}

export async function updateSiteSettings(newSettings: any) {
  try {
    const existing = await getSiteSettings();
    const merged = { ...existing, ...newSettings };
    
    await prisma.systemSettings.upsert({
      where: { key: SETTINGS_KEY },
      update: { value: JSON.stringify(merged) },
      create: { key: SETTINGS_KEY, value: JSON.stringify(merged) }
    });
    return merged;
  } catch (error) {
    console.error("Failed to update settings in DB:", error);
    throw error;
  }
}
