import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { studentName, password } = await request.json();

    if (!studentName || !password) {
      return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
    }

    const student = await prisma.student.findFirst({
      where: {
        name: { equals: studentName.trim() },
        password: { equals: password.trim() },
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
