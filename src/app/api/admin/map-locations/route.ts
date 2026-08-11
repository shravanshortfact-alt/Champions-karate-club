import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const locations = await prisma.mapLocation.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(locations);
  } catch (error) {
    console.error("Error fetching admin map locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch map locations" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.address) {
      return NextResponse.json(
        { error: "Name and address are required" },
        { status: 400 }
      );
    }

    const location = await prisma.mapLocation.create({
      data: {
        name: body.name,
        address: body.address,
        city: body.city || null,
        googleMapsUrl: body.googleMapsUrl || null,
        latitude: body.latitude ? parseFloat(body.latitude) : null,
        longitude: body.longitude ? parseFloat(body.longitude) : null,
        phone: body.phone || null,
        whatsapp: body.whatsapp || null,
        timings: body.timings || null,
        programs: body.programs || null,
        description: body.description || null,
        image: body.image || null,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    });

    return NextResponse.json(location);
  } catch (error) {
    console.error("Error creating map location:", error);
    return NextResponse.json(
      { error: "Failed to create map location" },
      { status: 500 }
    );
  }
}
