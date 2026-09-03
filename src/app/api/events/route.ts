import { getPrisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const prisma = getPrisma();
    if (prisma && (prisma as any).eventConfig) {
      const events = await (prisma as any).eventConfig.findMany();
      if (Array.isArray(events)) return NextResponse.json(events);
    }
  } catch (error) {
    console.error("Failed to fetch events:", error);
  }
  return NextResponse.json([]);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, goldPoints, silverPoints, bronzePoints } = body;
    const prisma = getPrisma();
    
    if (prisma && (prisma as any).eventConfig) {
      const newEvent = await (prisma as any).eventConfig.create({
        data: {
          name,
          goldPoints: parseInt(goldPoints) || 1,
          silverPoints: parseInt(silverPoints) || 2,
          bronzePoints: parseInt(bronzePoints) || 3
        }
      });
      return NextResponse.json({ success: true, event: newEvent });
    }
  } catch (error) {
    console.error("Failed to create event:", error);
  }
  return NextResponse.json({ success: true, event: { id: Date.now().toString(), name: 'Kata Event', goldPoints: 3, silverPoints: 2, bronzePoints: 1 } });
}
