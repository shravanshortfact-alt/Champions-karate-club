import { getPrisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export const runtime = 'edge';



const prisma = getPrisma();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, eventId, level, medal } = body;
    
    // Fetch Event Config to get point values
    const event = await prisma.eventConfig.findUnique({ where: { id: eventId } });
    if (!event) return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });

    let pointsEarned = 0;
    if (medal === 'Gold') pointsEarned = event.goldPoints;
    if (medal === 'Silver') pointsEarned = event.silverPoints;
    if (medal === 'Bronze') pointsEarned = event.bronzePoints;

    // Create Achievement in transaction alongside Student score update
    const result = await prisma.$transaction(async (tx) => {
      const achievement = await tx.achievement.create({
        data: {
          studentId,
          eventId,
          level,
          medal,
          pointsEarned
        }
      });

      // Update student points
      await tx.student.update({
        where: { id: studentId },
        data: {
          totalPoints: {
            increment: pointsEarned
          }
        }
      });

      return achievement;
    });

    return NextResponse.json({ success: true, achievement: result });
  } catch (error) {
    console.error("Error creating achievement:", error);
    return NextResponse.json({ success: false, error: "Failed to add achievement" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const achievements = await prisma.achievement.findMany({
      include: {
        student: true,
        event: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(achievements);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch achievements" }, { status: 500 });
  }
}
