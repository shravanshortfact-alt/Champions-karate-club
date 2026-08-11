import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'settings.json');

// Initialize default settings if file doesn't exist
async function getSettings() {
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    const parsed = JSON.parse(data);
    // Migrate single instructor to array if needed
    if (!parsed.instructors && parsed.instructor) {
      parsed.instructors = [parsed.instructor];
    } else if (!parsed.instructors) {
      parsed.instructors = [];
    }
    // Migrate old video fields to array
    if (!parsed.videos) {
      parsed.videos = [];
      if (parsed.trainingVideoUrl) {
        parsed.videos.push({ title: 'Training Sessions', url: parsed.trainingVideoUrl });
      }
      if (parsed.competitionVideoUrl) {
        parsed.videos.push({ title: 'Competition Highlights', url: parsed.competitionVideoUrl });
      }
    }
    // Migrate branches to objects
    if (parsed.branches && parsed.branches.length > 0 && typeof parsed.branches[0] === 'string') {
      parsed.branches = parsed.branches.map((b: string) => ({
        name: b,
        qrCodeUrl: ''
      }));
    } else if (!parsed.branches) {
      parsed.branches = [];
    }
    

    // Migrate registrationLinks
    if (!parsed.registrationLinks) {
      parsed.registrationLinks = [
        { title: "Admission", description: "Join the academy", link: "/register/admission", fee: "2500", qrCodeUrl: "" },
        { title: "Belt Exam", description: "Register for grading", link: "/register/belt-exam", fee: "1500", qrCodeUrl: "" },
        { title: "Competition", description: "Enter upcoming events", link: "/register/competition", fee: "1000", qrCodeUrl: "" },
        { title: "Seminar", description: "Special training camps", link: "/register/seminar", fee: "2000", qrCodeUrl: "" }
      ];
    } else {
      // Ensure existing links have fee and qrCodeUrl
      parsed.registrationLinks = parsed.registrationLinks.map((link: any) => ({
        ...link,
        fee: link.fee || "1500",
        qrCodeUrl: link.qrCodeUrl || ""
      }));
      // Add Fee Payment if it doesn't exist
      if (!parsed.registrationLinks.find((l: any) => l.title === 'Fee Payment')) {
        parsed.registrationLinks.push({ title: "Fee Payment", description: "Pay your monthly fees", link: "/pay-fee", fee: "700", qrCodeUrl: "" });
      }
    }

    return parsed;
  } catch (error) {
    const defaultSettings = {
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
        { title: "Seminar", description: "Special training camps", link: "/register/seminar", fee: "2000", qrCodeUrl: "" }
      ]
    };
    
    // Ensure directory exists
    try {
      await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true });
      await fs.writeFile(dbPath, JSON.stringify(defaultSettings, null, 2));
    } catch (e) {
      console.error("Could not write initial settings", e);
    }
    
    return defaultSettings;
  }
}

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  try {
    const newSettings = await request.json();
    const existingSettings = await getSettings(); // get existing settings to avoid overwriting unrelated fields
    
    // Merge existing with new settings
    const mergedSettings = { ...existingSettings, ...newSettings };
    
    await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true });
    await fs.writeFile(dbPath, JSON.stringify(mergedSettings, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to save settings" }, { status: 500 });
  }
}
