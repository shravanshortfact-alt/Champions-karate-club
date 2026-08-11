export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { studentId, currentPassword, newPassword } = await request.json();

    if (!studentId || !currentPassword || !newPassword) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

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
