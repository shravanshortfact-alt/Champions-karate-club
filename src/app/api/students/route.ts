import { getPrisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';



const prisma = getPrisma();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let where: any = {};
    if (status) {
      where.status = status;
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        branch: true,
        achievements: { include: { event: true } }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json({ success: true, student: updatedStudent });
  } catch (error) {
    console.error("Error updating student:", error);
    return NextResponse.json({ success: false, error: "Failed to update student" }, { status: 500 });
  }
}
