import { getPrisma, getD1 } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

const WORKER_CHANGE_PASSWORD_URL = 'https://karate-club.shravanshortfact.workers.dev/api/student/change-password';

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

  const { studentId, currentPassword, newPassword } = body;
  if (!studentId || !currentPassword || !newPassword) {
    return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
  }

  if (!d1 && process.env.NODE_ENV === 'production') {
    try {
      const res = await fetch(WORKER_CHANGE_PASSWORD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyText
      });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch (err: any) {
      console.error("Failed to forward change-password to Cloudflare Worker:", err);
    }
  }

  // 1. Direct D1 execution
  if (d1) {
    try {
      const student: any = await d1.prepare("SELECT password FROM Student WHERE id = ?").bind(studentId).first();
      if (!student || student.password !== currentPassword) {
        return NextResponse.json({ success: false, error: "Incorrect current password" }, { status: 401 });
      }

      await d1.prepare("UPDATE Student SET password = ? WHERE id = ?").bind(newPassword, studentId).run();
      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error("D1 error changing password:", error);
      return NextResponse.json({ success: false, error: "Failed to change password: " + (error?.message || String(error)) }, { status: 500 });
    }
  }

  // 2. Prisma fallback
  try {
    const prisma = getPrisma();
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student || student.password !== currentPassword) {
      return NextResponse.json({ success: false, error: "Incorrect current password" }, { status: 401 });
    }

    await prisma.student.update({
      where: { id: studentId },
      data: { password: newPassword }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json({ success: false, error: "Failed to change password" }, { status: 500 });
  }
}
