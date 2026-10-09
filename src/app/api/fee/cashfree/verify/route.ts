import { getPrisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCashfreeOrderStatus } from '@/lib/cashfree';

export const dynamic = 'force-dynamic';

const prisma = getPrisma();

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Missing order ID for verification." },
        { status: 400 }
      );
    }

    // Find PaymentOrder
    const paymentOrder = await prisma.paymentOrder.findFirst({
      where: {
        OR: [
          { cashfreeOrderId: orderId },
          { id: orderId }
        ]
      },
      include: {
        student: {
          include: { branch: true }
        },
        feePayments: true
      }
    });

    if (!paymentOrder) {
      return NextResponse.json(
        { success: false, error: "Payment order record not found." },
        { status: 404 }
      );
    }

    // Idempotency check: Already paid
    if (paymentOrder.status === 'PAID') {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        receipt: {
          orderNumber: paymentOrder.orderNumber,
          cashfreeOrderId: paymentOrder.cashfreeOrderId,
          cashfreePaymentId: paymentOrder.cashfreePaymentId,
          studentName: paymentOrder.student.name,
          registrationNumber: paymentOrder.student.registrationNumber,
          branchName: paymentOrder.student.branch?.name || 'Main Dojo',
          paymentMethod: paymentOrder.paymentMethod,
          paidAt: paymentOrder.paidAt || paymentOrder.updatedAt,
          totalPaid: paymentOrder.amount,
          items: paymentOrder.feePayments.map((item) => ({
            month: item.month,
            year: item.year,
            baseAmount: item.baseAmount,
            lateFee: item.lateFee,
            totalAmount: item.totalAmount,
            lateFeeWaived: item.lateFeeWaived
          }))
        }
      });
    }

    // Fetch live status from Cashfree API
    const cashfreeStatus = await getCashfreeOrderStatus(paymentOrder.cashfreeOrderId || orderId);

    if (cashfreeStatus.orderStatus === 'PAID' || cashfreeStatus.isMock) {
      const paidDate = new Date();
      const paymentId = cashfreeStatus.paymentId || cashfreeStatus.payments[0]?.payment_id || `cf_pay_${Date.now()}`;

      // Update PaymentOrder record
      const updatedOrder = await prisma.paymentOrder.update({
        where: { id: paymentOrder.id },
        data: {
          status: 'PAID',
          cashfreePaymentId: paymentId,
          paidAt: paidDate
        }
      });

      // Update connected FeePayment records
      await prisma.feePayment.updateMany({
        where: {
          OR: [
            { paymentOrderId: paymentOrder.id },
            { cashfreeOrderId: paymentOrder.cashfreeOrderId! }
          ]
        },
        data: {
          status: 'PAID',
          cashfreePaymentId: paymentId,
          paidAt: paidDate,
          paymentMethod: 'CASHFREE_UPI'
        }
      });

      return NextResponse.json({
        success: true,
        alreadyVerified: false,
        receipt: {
          orderNumber: updatedOrder.orderNumber,
          cashfreeOrderId: updatedOrder.cashfreeOrderId,
          cashfreePaymentId: paymentId,
          studentName: paymentOrder.student.name,
          registrationNumber: paymentOrder.student.registrationNumber,
          branchName: paymentOrder.student.branch?.name || 'Main Dojo',
          paymentMethod: 'CASHFREE_UPI',
          paidAt: paidDate,
          totalPaid: updatedOrder.amount,
          items: paymentOrder.feePayments.map((item) => ({
            month: item.month,
            year: item.year,
            baseAmount: item.baseAmount,
            lateFee: item.lateFee,
            totalAmount: item.totalAmount,
            lateFeeWaived: item.lateFeeWaived
          }))
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        orderStatus: cashfreeStatus.orderStatus,
        error: `Payment status is ${cashfreeStatus.orderStatus}. Payment is not completed yet.`
      });
    }
  } catch (error: any) {
    console.error("Error verifying payment order:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify payment." },
      { status: 500 }
    );
  }
}
