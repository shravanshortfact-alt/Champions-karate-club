import { getPrisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export const runtime = 'edge';



const prisma = getPrisma();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, profilePhotoUrl, instagramLink } = body;

    if (!studentId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

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
