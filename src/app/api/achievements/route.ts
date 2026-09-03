import { getPrisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, eventId, level, medal } = body;
    const prisma = getPrisma();
    
    if (prisma && (prisma as any).eventConfig && (prisma as any).achievement) {
      const event = await (prisma as any).eventConfig.findUnique({ where: { id: eventId } });
      if (!event) return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });

      let pointsEarned = 0;
      if (medal === 'Gold') pointsEarned = event.goldPoints;
      if (medal === 'Silver') pointsEarned = event.silverPoints;
      if (medal === 'Bronze') pointsEarned = event.bronzePoints;

      const result = await (prisma as any).$transaction(async (tx: any) => {
        const achievement = await tx.achievement.create({
          data: {
            studentId,
            eventId,
            level,
            medal,
            pointsEarned
          }
        });

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
    }
  } catch (error) {
    console.error("Error creating achievement:", error);
  }
  return NextResponse.json({ success: false, error: "Failed to add achievement" }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    const prisma = getPrisma();
    if (prisma && (prisma as any).achievement) {
      const achievements = await (prisma as any).achievement.findMany({
        include: {
          student: true,
          event: true
        },
        orderBy: { createdAt: 'desc' }
      });
      if (Array.isArray(achievements)) return NextResponse.json(achievements);
    }
  } catch (error) {
    console.error("Failed to fetch achievements:", error);
  }
  return NextResponse.json([]);
}
