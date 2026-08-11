export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const feePayments = await prisma.feePayment.findMany({
      include: {
        student: {
          include: { branch: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(feePayments);
  } catch (error) {
    console.error("Error fetching fee payments:", error);
    return NextResponse.json({ error: "Failed to fetch fee payments" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    const updated = await prisma.feePayment.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json({ success: true, payment: updated });
  } catch (error) {
    console.error("Error updating fee payment:", error);
    return NextResponse.json({ success: false, error: "Failed to update fee payment" }, { status: 500 });
  }
}
