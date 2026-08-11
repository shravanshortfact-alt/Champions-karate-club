import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const logs = await prisma.messageLog.findMany({
      include: {
        student: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch message logs" }, { status: 500 });
  }
}
