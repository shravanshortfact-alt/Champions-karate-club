import { getPrisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export const runtime = 'edge';



const prisma = getPrisma();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, month, year, baseAmount, lateFee, totalAmount, transactionId, screenshotUrl } = body;

    if (!studentId || !month || !year || !baseAmount || !totalAmount) {
      return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
    }

    if (!transactionId && !screenshotUrl) {
      return NextResponse.json({ success: false, error: "Please provide either a Transaction ID (UTR) or a screenshot." }, { status: 400 });
    }

    // Check if a pending or verified payment already exists for this month/year
    const existing = await prisma.feePayment.findFirst({
      where: { studentId, month, year }
    });

    if (existing) {
      return NextResponse.json({ success: false, error: "A payment record for this month already exists." }, { status: 400 });
    }

    const feePayment = await prisma.feePayment.create({
      data: {
        studentId,
        month,
        year,
        baseAmount,
        lateFee,
        totalAmount,
        transactionId: transactionId || null,
        screenshotUrl: screenshotUrl || null,
        status: "Pending"
      }
    });

    return NextResponse.json({ success: true, payment: feePayment });
  } catch (error) {
    console.error("Error submitting fee payment:", error);
    return NextResponse.json({ success: false, error: "Failed to submit fee payment" }, { status: 500 });
  }
}
