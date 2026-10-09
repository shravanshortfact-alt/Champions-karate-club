import { getPrisma, getD1 } from '@/lib/prisma';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ regNo: string }> | { regNo: string } }
) {
  const resolvedParams = await params;
  const { regNo } = resolvedParams;
  const searchTerm = decodeURIComponent(regNo || '').trim();
  const d1 = getD1();

  // Forward to Worker if on Vercel without D1
  if (!d1 && process.env.NODE_ENV === 'production') {
    try {
      const res = await fetch(`https://karate-club.shravanshortfact.workers.dev/api/student/${encodeURIComponent(regNo)}`, {
        headers: { 'Cache-Control': 'no-cache' },
        cache: 'no-store'
      });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch (err: any) {
      console.error("Failed to forward student fetch to Cloudflare Worker:", err);
    }
  }

  // 1. Direct D1 execution
  if (d1) {
    try {
      const student: any = await d1.prepare(`
        SELECT s.*, b.name as branchName 
        FROM Student s 
        LEFT JOIN Branch b ON s.branchId = b.id 
        WHERE LOWER(TRIM(s.name)) = LOWER(TRIM(?)) OR UPPER(TRIM(s.registrationNumber)) = UPPER(TRIM(?))
      `).bind(searchTerm, searchTerm).first();

      if (!student) {
        return NextResponse.json({ error: "No records found for this ID or Name" }, { status: 404 });
      }

      const { results: allRecords } = await d1.prepare(`
        SELECT * FROM Registration WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) ORDER BY createdAt DESC
      `).bind(student.name).all();

      let achievements: any[] = [];
      try {
        const { results: achRows } = await d1.prepare(`
          SELECT a.*, e.name as eventName 
          FROM Achievement a 
          LEFT JOIN EventConfig e ON a.eventId = e.id 
          WHERE a.studentId = ? AND a.status != 'Rejected' 
          ORDER BY a.createdAt DESC
        `).bind(student.id).all();
        achievements = (achRows || []).map((a: any) => ({
          ...a,
          event: { name: a.eventName || 'Event' }
        }));
      } catch (e) {}

      let globalRank: any = '-';
      try {
        const { results: activeStudents } = await d1.prepare(`
          SELECT id, totalPoints FROM Student WHERE status = 'Active' ORDER BY totalPoints DESC
        `).all();
        const rankIdx = (activeStudents || []).findIndex((s: any) => s.id === student.id);
        if (rankIdx !== -1) globalRank = rankIdx + 1;
      } catch (e) {}

      const profile = {
        id: student.id,
        currentBelt: student.currentBelt,
        totalPoints: student.totalPoints,
        profilePhotoUrl: student.profilePhotoUrl,
        globalRank,
        name: student.name,
        registrationNumber: student.registrationNumber,
        age: student.age,
        dob: student.dob,
        branch: student.branchName || ''
      };

      return NextResponse.json({
        registrations: (allRecords && allRecords.length > 0) ? allRecords : [{ id: student.registrationNumber, name: student.name, category: 'Admission', branch: student.branchId }],
        profile,
        achievements
      });
    } catch (error: any) {
      console.error("D1 error fetching student data:", error);
      return NextResponse.json({ error: "Failed to fetch student data from D1: " + (error?.message || String(error)) }, { status: 500 });
    }
  }

  // 2. Prisma fallback (local dev)
  try {
    const prisma = getPrisma();
    const student: any = await prisma.student.findFirst({
      where: {
        OR: [
          { name: { equals: searchTerm } },
          { registrationNumber: { equals: searchTerm } }
        ]
      },
      include: {
        branch: true,
        achievements: {
          where: { status: { not: 'Rejected' } },
          include: { event: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!student) {
      return NextResponse.json({ error: "No records found for this ID or Name" }, { status: 404 });
    }

    const allRecords = await prisma.registration.findMany({
      where: {
        name: { equals: student.name }
      }
    });

    const allStudents = await prisma.student.findMany({
      where: { status: 'Active' },
      select: { id: true, totalPoints: true },
      orderBy: { totalPoints: 'desc' }
    });
    const rankIndex = allStudents.findIndex((s: any) => s.id === student.id);
    const globalRank = rankIndex !== -1 ? rankIndex + 1 : '-';

    const profile = {
      id: student.id,
      currentBelt: student.currentBelt,
      totalPoints: student.totalPoints,
      profilePhotoUrl: student.profilePhotoUrl,
      globalRank,
      name: student.name,
      registrationNumber: student.registrationNumber,
      age: student.age,
      dob: student.dob,
      branch: student.branch?.name
    };

    return NextResponse.json({
      registrations: allRecords.length > 0 ? allRecords : [{ id: student.registrationNumber, name: student.name, category: 'Admission', branch: student.branchId }],
      profile,
      achievements: student.achievements
    });
  } catch (error) {
    console.error("Error fetching student data:", error);
    return NextResponse.json({ error: "Failed to fetch student data" }, { status: 500 });
  }
}
