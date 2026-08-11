import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentName = searchParams.get('studentName');

    if (!studentName) {
      return NextResponse.json({ success: false, error: "Student name is required" }, { status: 400 });
    }

    const student = await prisma.student.findFirst({
      where: { name: studentName }
    });

    if (!student) {
      return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });
    }

    const notifications = await prisma.notificationRecipient.findMany({
      where: { studentId: student.id },
      include: {
        notification: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    return NextResponse.json({ success: true, notifications });
  } catch (error) {
    console.error("Error fetching student notifications:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch notifications" }, { status: 500 });
  }
}
