import { getPrisma } from '@/lib/prisma';
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";


const prisma = getPrisma();

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    if (!id) {
        return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }
    
    const body = await request.json();

    const updateData: any = {
      name: body.name,
      address: body.address,
      city: body.city,
      googleMapsUrl: body.googleMapsUrl,
      phone: body.phone,
      whatsapp: body.whatsapp,
      timings: body.timings,
      programs: body.programs,
      description: body.description,
      image: body.image,
      isActive: body.isActive,
    };

    if (body.latitude !== undefined) {
      updateData.latitude = body.latitude ? parseFloat(body.latitude) : null;
    }
    if (body.longitude !== undefined) {
      updateData.longitude = body.longitude ? parseFloat(body.longitude) : null;
    }

    const location = await prisma.mapLocation.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(location);
  } catch (error) {
    console.error("Error updating map location:", error);
    return NextResponse.json(
      { error: "Failed to update map location" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    if (!id) {
        return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.mapLocation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting map location:", error);
    return NextResponse.json(
      { error: "Failed to delete map location" },
      { status: 500 }
    );
  }
}
