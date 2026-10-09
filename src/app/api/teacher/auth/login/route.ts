import { getPrisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const prisma = getPrisma();

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Please enter username and password." },
        { status: 400 }
      );
    }

    const teacher = await prisma.teacher.findFirst({
      where: {
        username: username.trim(),
        password: password.trim()
      },
      include: {
        branches: true
      }
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, error: "Invalid teacher username or password." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      teacher: {
        id: teacher.id,
        name: teacher.name,
        username: teacher.username,
        upiId: teacher.upiId,
        upiDisplayName: teacher.upiDisplayName,
        paymentEnabled: teacher.paymentEnabled,
        branches: teacher.branches.map(b => ({ id: b.id, name: b.name }))
      }
    });

    // Set secure HTTP cookie
    response.cookies.set('teacher_session_id', teacher.id, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;
  } catch (error: any) {
    console.error("Error in teacher login:", error);
    return NextResponse.json({ success: false, error: "Teacher login failed" }, { status: 500 });
  }
}
