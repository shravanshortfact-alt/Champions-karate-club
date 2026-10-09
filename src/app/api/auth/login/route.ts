import { getPrisma, getD1 } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

const WORKER_LOGIN_URL = 'https://karate-club.shravanshortfact.workers.dev/api/auth/login';

export async function POST(request: Request) {
  const d1 = getD1();
  const rawBodyText = await request.text();
  const bodyText = rawBodyText.replace(/^\uFEFF/, '').trim();
  let body: any = {};
  try {
    body = JSON.parse(bodyText);
  } catch (e) {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { studentName, password } = body;
  if (!studentName || !password) {
    return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
  }

  // Forward to Cloudflare Worker if running on Vercel without D1
  if (!d1 && process.env.NODE_ENV === 'production') {
    try {
      const res = await fetch(WORKER_LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyText
      });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch (err: any) {
      console.error("Failed to forward login to Cloudflare Worker:", err);
    }
  }

  const trimmedName = String(studentName).trim();
  const trimmedPass = String(password).trim();

  // 1. Direct D1 execution
  if (d1) {
    try {
      let student: any = await d1.prepare(`
        SELECT id, name, password, status 
        FROM Student 
        WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) AND TRIM(password) = ? AND status = 'Active'
      `).bind(trimmedName, trimmedPass).first();

      if (!student) {
        // Also check by registrationNumber
        student = await d1.prepare(`
          SELECT id, name, password, status 
          FROM Student 
          WHERE UPPER(TRIM(registrationNumber)) = UPPER(TRIM(?)) AND TRIM(password) = ? AND status = 'Active'
        `).bind(trimmedName, trimmedPass).first();
      }

      if (!student) {
        return NextResponse.json({ success: false, error: "Invalid Student Name or Password." }, { status: 401 });
      }

      return NextResponse.json({ success: true, token: student.id, studentName: student.name });
    } catch (error: any) {
      console.error("D1 login error:", error);
      return NextResponse.json({ success: false, error: "Failed to login: " + (error?.message || String(error)) }, { status: 500 });
    }
  }

  // 2. Prisma fallback (local dev)
  try {
    const prisma = getPrisma();
    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { name: { equals: trimmedName } },
          { registrationNumber: { equals: trimmedName } }
        ],
        password: { equals: trimmedPass },
        status: 'Active'
      }
    });

    if (!student) {
      return NextResponse.json({ success: false, error: "Invalid Student Name or Password." }, { status: 401 });
    }

    return NextResponse.json({ success: true, token: student.id, studentName: student.name });
  } catch (error) {
    console.error("Error logging in:", error);
    return NextResponse.json({ success: false, error: "Failed to login" }, { status: 500 });
  }
}
