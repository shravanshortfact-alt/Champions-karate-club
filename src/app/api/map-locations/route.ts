import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const locations = await prisma.mapLocation.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(locations);
  } catch (error) {
    console.error("Error fetching map locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch map locations" },
      { status: 500 }
    );
  }
}
