export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const students = await prisma.student.findMany({
      where: {
        name: {
          contains: query
        },
        status: 'Active'
      },
      include: {
        branch: true
      },
      take: 10
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error("Error searching students:", error);
    return NextResponse.json({ error: "Failed to search students" }, { status: 500 });
  }
}
