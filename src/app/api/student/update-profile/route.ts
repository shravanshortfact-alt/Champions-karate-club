import { getPrisma, getD1 } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

const WORKER_UPDATE_PROFILE_URL = 'https://karate-club.shravanshortfact.workers.dev/api/student/update-profile';

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

  const { studentId, profilePhotoUrl, instagramLink } = body;
  if (!studentId) {
    return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
  }

  if (!d1 && process.env.NODE_ENV === 'production') {
    try {
      const res = await fetch(WORKER_UPDATE_PROFILE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyText
      });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch (err: any) {
      console.error("Failed to forward update-profile to Cloudflare Worker:", err);
    }
  }

  // 1. Direct D1 execution
  if (d1) {
    try {
      if (profilePhotoUrl !== undefined && instagramLink !== undefined) {
        await d1.prepare("UPDATE Student SET profilePhotoUrl = ?, instagramLink = ? WHERE id = ?").bind(profilePhotoUrl, instagramLink, studentId).run();
      } else if (profilePhotoUrl !== undefined) {
        await d1.prepare("UPDATE Student SET profilePhotoUrl = ? WHERE id = ?").bind(profilePhotoUrl, studentId).run();
      } else if (instagramLink !== undefined) {
        await d1.prepare("UPDATE Student SET instagramLink = ? WHERE id = ?").bind(instagramLink, studentId).run();
      }

      const updatedStudent: any = await d1.prepare("SELECT * FROM Student WHERE id = ?").bind(studentId).first();
      return NextResponse.json({ success: true, student: updatedStudent });
    } catch (error: any) {
      console.error("D1 error updating profile:", error);
      return NextResponse.json({ success: false, error: "Failed to update profile: " + (error?.message || String(error)) }, { status: 500 });
    }
  }

  // 2. Prisma fallback
  try {
    const prisma = getPrisma();
    const dataToUpdate: any = {};
    if (profilePhotoUrl !== undefined) dataToUpdate.profilePhotoUrl = profilePhotoUrl;
    if (instagramLink !== undefined) dataToUpdate.instagramLink = instagramLink;

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, student: updatedStudent });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 500 });
  }
}
