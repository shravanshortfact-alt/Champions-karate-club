import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const events = await prisma.eventConfig.findMany();
    return NextResponse.json(events);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, goldPoints, silverPoints, bronzePoints } = body;
    
    const newEvent = await prisma.eventConfig.create({
      data: {
        name,
        goldPoints: parseInt(goldPoints) || 1,
        silverPoints: parseInt(silverPoints) || 2,
        bronzePoints: parseInt(bronzePoints) || 3
      }
    });

    return NextResponse.json({ success: true, event: newEvent });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create event" }, { status: 500 });
  }
}
