import { getPrisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const runtime = 'edge';



const prisma = getPrisma();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ regNo: string }> | { regNo: string } }
) {
  try {
    const resolvedParams = await params;
    const { regNo } = resolvedParams;
    const searchTerm = decodeURIComponent(regNo).trim();

    // First find the Student
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

    // Now fetch all registrations for this student's name
    const allRecords = await prisma.registration.findMany({
      where: {
        name: { equals: student.name }
      }
    });

    // Calculate Rank
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
