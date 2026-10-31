import { getPrisma, getD1 } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const WORKER_STUDENTS_URL = 'https://karate-club.shravanshortfact.workers.dev/api/students';

export async function GET(request: Request) {
  const d1 = getD1();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  // Forward to Cloudflare Worker if running in environment without D1 (e.g. Vercel)
  if (!d1 && process.env.NODE_ENV === 'production') {
    try {
      const res = await fetch(`${WORKER_STUDENTS_URL}?${searchParams.toString()}`, {
        headers: { 'Cache-Control': 'no-cache' },
        cache: 'no-store'
      });
      const data = await res.json();
      return NextResponse.json(data);
    } catch (err: any) {
      console.error("Failed to fetch students from Cloudflare Worker:", err);
    }
  }

  // 1. Direct D1 execution
  if (d1) {
    try {
      let query = `
        SELECT s.*, b.name as branchName, b.address as branchAddress 
        FROM Student s 
        LEFT JOIN Branch b ON s.branchId = b.id
      `;
      const params: any[] = [];
      if (status) {
        query += " WHERE s.status = ?";
        params.push(status);
      }
      query += " ORDER BY s.createdAt DESC";

      const stmt = params.length > 0 ? d1.prepare(query).bind(...params) : d1.prepare(query);
      const { results: rawStudents } = await stmt.all();

      let rawAchievements: any[] = [];
      try {
        const achRes = await d1.prepare(`
          SELECT a.*, e.name as eventName 
          FROM Achievement a 
          LEFT JOIN EventConfig e ON a.eventId = e.id
        `).all();
        rawAchievements = achRes.results || [];
      } catch (achErr) {}

      const students = (rawStudents || []).map((s: any) => ({
        ...s,
        branch: s.branchName ? { id: s.branchId, name: s.branchName, address: s.branchAddress } : null,
        achievements: rawAchievements
          .filter((a: any) => a.studentId === s.id)
          .map((a: any) => ({
            ...a,
            event: a.eventName ? { id: a.eventId, name: a.eventName } : null
          }))
      }));

      return NextResponse.json(students);
    } catch (d1Err: any) {
      console.error("D1 error fetching students:", d1Err);
    }
  }

  // 2. Prisma fallback
  try {
    let where: any = {};
    if (status) {
      where.status = status;
    }

    const prisma = getPrisma();
    if (prisma && (prisma as any).student) {
      const students = await (prisma as any).student.findMany({
        where,
        include: {
          branch: true,
          achievements: { include: { event: true } }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      if (Array.isArray(students)) return NextResponse.json(students);
    }
  } catch (error) {
    console.error("Error fetching students via Prisma:", error);
  }
  return NextResponse.json([]);
}

export async function PATCH(request: Request) {
  const d1 = getD1();
  const rawBodyText = await request.text();
  const bodyText = rawBodyText.replace(/^\uFEFF/, '').trim();

  // Forward to Cloudflare Worker if running on Vercel
  if (!d1 && process.env.NODE_ENV === 'production') {
    try {
      const res = await fetch(WORKER_STUDENTS_URL, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: bodyText
      });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch (err: any) {
      console.error("Failed to forward PATCH student to Cloudflare Worker:", err);
    }
  }

  let body: any = {};
  try {
    body = JSON.parse(bodyText);
  } catch (e) {}

  const { id, status } = body;

  if (d1) {
    try {
      await d1.prepare("UPDATE Student SET status = ? WHERE id = ?").bind(status, id).run();
      const updated = await d1.prepare("SELECT * FROM Student WHERE id = ?").bind(id).first();
      return NextResponse.json({ success: true, student: updated });
    } catch (d1Err: any) {
      console.error("D1 error updating student:", d1Err);
      return NextResponse.json({ success: false, error: d1Err.message }, { status: 500 });
    }
  }

  try {
    const prisma = getPrisma();
    if (prisma && (prisma as any).student) {
      const updatedStudent = await (prisma as any).student.update({
        where: { id },
        data: { status }
      });
      return NextResponse.json({ success: true, student: updatedStudent });
    }
  } catch (error: any) {
    console.error("Error updating student via Prisma:", error);
  }
  return NextResponse.json({ success: false, error: "Failed to update student" }, { status: 500 });
}
