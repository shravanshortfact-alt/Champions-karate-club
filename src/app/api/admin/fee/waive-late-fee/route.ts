import { getPrisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getSiteSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

const prisma = getPrisma();

export async function POST(request: Request) {
  try {
    const { studentId, month, year, waiverReason, adminName = 'Admin' } = await request.json();

    if (!studentId || !month || !year) {
      return NextResponse.json(
        { success: false, error: "Missing studentId, month, or year to waive late fee." },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found." },
        { status: 404 }
      );
    }

    const settings = await getSiteSettings();
    const defaultMonthlyFee = Number(settings.defaultMonthlyFee) || 700;
    const baseMonthlyFee = student.monthlyFee > 0 ? student.monthlyFee : defaultMonthlyFee;

    const existing = await prisma.feePayment.findFirst({
      where: {
        studentId: student.id,
        month,
        year: Number(year)
      }
    });

    const waivedDate = new Date();
    let updatedRecord;

    if (existing) {
      updatedRecord = await prisma.feePayment.update({
        where: { id: existing.id },
        data: {
          lateFee: 0,
          totalAmount: existing.baseAmount,
          lateFeeWaived: true,
          waiverReason: waiverReason || 'Waived by Admin',
          waivedBy: adminName,
          waivedAt: waivedDate
        }
      });
    } else {
      updatedRecord = await prisma.feePayment.create({
        data: {
          studentId: student.id,
          month,
          year: Number(year),
          baseAmount: baseMonthlyFee,
          lateFee: 0,
          totalAmount: baseMonthlyFee,
          status: 'UNPAID',
          lateFeeWaived: true,
          waiverReason: waiverReason || 'Waived by Admin',
          waivedBy: adminName,
          waivedAt: waivedDate
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Late fee successfully waived for ${month} ${year} (${student.name})`,
      feePayment: updatedRecord
    });
  } catch (error: any) {
    console.error("Error waiving late fee:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to waive late fee." },
      { status: 500 }
    );
  }
}
