import { getPrisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';


const prisma = getPrisma();

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
