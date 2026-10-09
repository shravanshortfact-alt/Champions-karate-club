import { getPrisma, getD1 } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

const WORKER_REGISTRATIONS_URL = 'https://karate-club.shravanshortfact.workers.dev/api/registrations';

export async function GET() {
  const d1 = getD1();
  if (!d1 && process.env.NODE_ENV === 'production') {
    try {
      const res = await fetch(WORKER_REGISTRATIONS_URL, {
        headers: { 'Cache-Control': 'no-cache' },
        cache: 'no-store'
      });
      const data = await res.json();
      return NextResponse.json(data);
    } catch (err: any) {
      console.error("Failed to fetch registrations from Cloudflare Worker:", err);
    }
  }

  // 1. Direct D1 execution
  if (d1) {
    try {
      const { results: registrations } = await d1.prepare("SELECT * FROM Registration ORDER BY createdAt DESC").all();
      const { results: archivedStudents } = await d1.prepare("SELECT registrationNumber FROM Student WHERE status = 'Archived'").all();
      
      const archivedRegNumbers = new Set((archivedStudents || []).map((s: any) => s.registrationNumber));
      const activeRegistrations = (registrations || []).filter((r: any) => !archivedRegNumbers.has(r.id));

      const formatted = activeRegistrations.map((r: any) => {
        let extra: any = {};
        try {
          if (r.extraData) extra = JSON.parse(r.extraData);
        } catch (e) {}
        const belt = extra.currentBelt || extra.belt || r.appearingBelt || 'White Belt';
        return {
          ...extra,
          ...r,
          currentBelt: belt,
          belt: belt,
          appearingBelt: r.appearingBelt || belt
        };
      });

      return NextResponse.json(formatted);
    } catch (error: any) {
      console.error("D1 error fetching registrations:", error);
      return NextResponse.json({ 
        error: "Failed to load registrations from D1", 
        message: error?.message || String(error) 
      }, { status: 500 });
    }
  }

  // 2. Prisma fallback
  try {
    const prisma = getPrisma();
    const registrations = await prisma.registration.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const archivedStudents = await prisma.student.findMany({
      where: { status: 'Archived' },
      select: { registrationNumber: true }
    });
    
    const archivedRegNumbers = new Set(archivedStudents.map(s => s.registrationNumber));
    const activeRegistrations = registrations.filter(r => !archivedRegNumbers.has(r.id));

    const formatted = activeRegistrations.map((r: any) => {
      let extra: any = {};
      try {
        if (r.extraData) extra = JSON.parse(r.extraData);
      } catch (e) {}
      const belt = extra.currentBelt || extra.belt || r.appearingBelt || 'White Belt';
      return {
        ...extra,
        ...r,
        currentBelt: belt,
        belt: belt,
        appearingBelt: r.appearingBelt || belt
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("Error fetching registrations:", error);
    return NextResponse.json({ 
      error: "Failed to load registrations", 
      message: error?.message || String(error) 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const d1 = getD1();
  const rawBodyText = await request.text();
  const bodyText = rawBodyText.replace(/^\uFEFF/, '').trim();
  let newRegistration: any = {};
  try {
    newRegistration = JSON.parse(bodyText);
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!d1 && process.env.NODE_ENV === 'production') {
    try {
      const res = await fetch(WORKER_REGISTRATIONS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyText
      });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch (err: any) {
      console.error("Failed to forward registration to Cloudflare Worker:", err);
    }
  }

  const idPrefix = newRegistration.category === 'Admission' ? 'CKC' : 
                   newRegistration.category === 'Belt Exam' ? 'EXM' : 
                   newRegistration.category === 'Competition' ? 'CMP' : 'SEM';
                   
  const id = `${idPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;
  const month = new Date().toLocaleString('en-US', { month: 'long' });
  const appearingBelt = newRegistration.appearingBelt || newRegistration.currentBelt || newRegistration.belt || '';

  // 1. Direct D1 execution
  if (d1) {
    try {
      await d1.prepare(`
        INSERT INTO Registration (id, category, name, age, branch, profilePhotoUrl, dob, whatsappNumber, appearingBelt, status, month, extraData, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        newRegistration.category || '',
        newRegistration.name || '',
        String(newRegistration.age || ''),
        newRegistration.branch || '',
        newRegistration.profilePhotoUrl || '',
        newRegistration.dob || '',
        newRegistration.whatsappNumber || '',
        appearingBelt,
        'Pending',
        month,
        JSON.stringify(newRegistration),
        new Date().toISOString()
      ).run();

      if (newRegistration.category === 'Belt Exam' && newRegistration.name && appearingBelt) {
        try {
          await d1.prepare("UPDATE Student SET currentBelt = ? WHERE name = ? AND status = 'Active'")
            .bind(appearingBelt, newRegistration.name).run();
        } catch (e) {
          console.error("Failed to auto upgrade belt in D1:", e);
        }
      }

      return NextResponse.json({ success: true, id });
    } catch (error: any) {
      console.error("D1 error saving registration:", error);
      return NextResponse.json({ 
        error: "Failed to save registration to D1", 
        message: error?.message || String(error) 
      }, { status: 500 });
    }
  }

  // 2. Prisma fallback
  try {
    const prisma = getPrisma();
    const registration = await prisma.registration.create({
      data: {
        id,
        category: newRegistration.category || '',
        name: newRegistration.name || '',
        age: String(newRegistration.age || ''),
        branch: newRegistration.branch || '',
        profilePhotoUrl: newRegistration.profilePhotoUrl || '',
        dob: newRegistration.dob || '',
        whatsappNumber: newRegistration.whatsappNumber || '',
        appearingBelt: appearingBelt,
        status: 'Pending',
        month,
        extraData: JSON.stringify(newRegistration)
      }
    });

    if (newRegistration.category === 'Belt Exam' && newRegistration.name && appearingBelt) {
      try {
        const student = await prisma.student.findFirst({
          where: { name: newRegistration.name, status: 'Active' }
        });
        
        if (student) {
          await prisma.student.update({
            where: { id: student.id },
            data: { currentBelt: appearingBelt }
          });
        }
      } catch (e) {
        console.error("Failed to automatically upgrade belt in Prisma", e);
      }
    }

    return NextResponse.json({ success: true, id: registration.id });
  } catch (error: any) {
    console.error("Error saving registration:", error);
    return NextResponse.json({ 
      error: "Failed to save registration", 
      message: error?.message || String(error) 
    }, { status: 500 });
  }
}
