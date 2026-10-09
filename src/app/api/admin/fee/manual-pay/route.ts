import { getPrisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { calculateMonthFeeDetails } from '@/lib/fee-calculator';
import { getSiteSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

const prisma = getPrisma();

export async function POST(request: Request) {
  try {
    const { studentId, month, year, paymentMethod = 'CASH', note, adminName = 'Admin' } = await request.json();

    if (!studentId || !month || !year) {
      return NextResponse.json(
        { success: false, error: "Missing studentId, month, or year for manual payment." },
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
    const lateFeeAmount = Number(settings.lateFeeAmount) || 100;
    const dueDay = Number(settings.dueDay) || 10;
    const baseMonthlyFee = student.monthlyFee > 0 ? student.monthlyFee : defaultMonthlyFee;

    // Check existing record
    const existing = await prisma.feePayment.findFirst({
      where: {
        studentId: student.id,
        month,
        year: Number(year)
      }
    });

    if (existing && (existing.status === 'PAID' || existing.status === 'Verified')) {
      return NextResponse.json(
        { success: false, error: `Fee for ${month} ${year} is already marked as PAID.` },
        { status: 400 }
      );
    }

    const isWaived = existing?.lateFeeWaived ?? false;

    const calc = calculateMonthFeeDetails({
      monthName: month,
      year: Number(year),
      baseMonthlyFee: existing?.baseAmount || baseMonthlyFee,
      isPaid: true,
      isPending: false,
      isWaived,
      dueDay,
      lateFeeAmount
    });

    const paidDate = new Date();
    const orderNumber = `MAN-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*10000)}`;

    // Create PaymentOrder for manual payment
    const paymentOrder = await prisma.paymentOrder.create({
      data: {
        orderNumber,
        studentId: student.id,
        amount: calc.totalAmount,
        status: 'PAID',
        paymentMethod: 'ADMIN_MANUAL',
        manualPaymentNote: `Method: ${paymentMethod}. ${note || ''}`,
        paidAt: paidDate
      }
    });

    let feeRecord;
    if (existing) {
      feeRecord = await prisma.feePayment.update({
        where: { id: existing.id },
        data: {
          baseAmount: calc.baseAmount,
          lateFee: calc.lateFee,
          totalAmount: calc.totalAmount,
          status: 'PAID',
          paymentMethod: `ADMIN_MANUAL (${paymentMethod})`,
          paymentOrderId: paymentOrder.id,
          paidAt: paidDate
        }
      });
    } else {
      feeRecord = await prisma.feePayment.create({
        data: {
          studentId: student.id,
          month,
          year: Number(year),
          baseAmount: calc.baseAmount,
          lateFee: calc.lateFee,
          totalAmount: calc.totalAmount,
          status: 'PAID',
          paymentMethod: `ADMIN_MANUAL (${paymentMethod})`,
          paymentOrderId: paymentOrder.id,
          paidAt: paidDate
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully marked ${month} ${year} as PAID for ${student.name}`,
      feePayment: feeRecord,
      receiptNumber: orderNumber
    });
  } catch (error: any) {
    console.error("Error in admin manual fee payment:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process manual payment." },
      { status: 500 }
    );
  }
}
