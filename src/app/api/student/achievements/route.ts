import { getPrisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export const runtime = 'edge';



const prisma = getPrisma();

export async function POST(request: Request) {
  try {
    const { studentId, eventId, level, medal } = await request.json();

    if (!studentId || !eventId || !level || !medal) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const event = await prisma.eventConfig.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
    }

    let pointsEarned = 0;
    if (medal === 'Gold') pointsEarned = event.goldPoints;
    else if (medal === 'Silver') pointsEarned = event.silverPoints;
    else if (medal === 'Bronze') pointsEarned = event.bronzePoints;

    const achievement = await prisma.achievement.create({
      data: {
        studentId,
        eventId,
        level,
        medal,
        pointsEarned,
        status: 'Pending'
      }
    });

    return NextResponse.json({ success: true, achievement });
  } catch (error) {
    console.error("Error submitting achievement:", error);
    return NextResponse.json({ success: false, error: "Failed to submit achievement" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    const updated = await prisma.achievement.update({
      where: { id },
      data: { status }
    });
    
    // If approved, update student points
    if (status === 'Approved') {
        await prisma.student.update({
            where: { id: updated.studentId },
            data: { totalPoints: { increment: updated.pointsEarned } }
        });
    }

    return NextResponse.json({ success: true, achievement: updated });
  } catch (error) {
    console.error("Error updating achievement:", error);
    return NextResponse.json({ success: false, error: "Failed to update achievement" }, { status: 500 });
  }
}
