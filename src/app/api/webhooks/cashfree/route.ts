import { getPrisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCashfreeConfig, verifyCashfreeWebhookSignature } from '@/lib/cashfree';

export const dynamic = 'force-dynamic';

const prisma = getPrisma();

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const headers = request.headers;

    const signature = headers.get('x-webhook-signature') || '';
    const timestamp = headers.get('x-webhook-timestamp') || '';

    const config = await getCashfreeConfig();

    // Verify signature if secret key is available
    if (config.secretKey && signature && timestamp) {
      const isValid = verifyCashfreeWebhookSignature({
        rawBody,
        timestamp,
        signature,
        secretKey: config.secretKey
      });

      if (!isValid) {
        console.warn("Cashfree webhook signature verification failed.");
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const eventType = payload.type || payload.event;
    const orderData = payload.data?.order || payload.order;
    const paymentData = payload.data?.payment || payload.payment;

    const orderId = orderData?.order_id || payload.order_id;
    const paymentId = paymentData?.payment_id || payload.payment_id;

    if (!orderId) {
      return NextResponse.json({ status: "IGNORED", reason: "No order ID in payload" });
    }

    // STRICT SEPARATION: Check if order is KARATE_FEE_PAYMENT
    // Student fees start with KFEE_
    if (!orderId.startsWith('KFEE_')) {
      return NextResponse.json({ status: "SKIPPED", reason: "Not a student fee payment order" });
    }

    if (eventType === 'PAYMENT_SUCCESS_WEBHOOK' || eventType === 'ORDER_PAID' || paymentData?.payment_status === 'SUCCESS') {
      const paymentOrder = await prisma.paymentOrder.findFirst({
        where: { cashfreeOrderId: orderId },
        include: { feePayments: true }
      });

      if (paymentOrder && paymentOrder.status !== 'PAID') {
        const paidDate = new Date();

        await prisma.paymentOrder.update({
          where: { id: paymentOrder.id },
          data: {
            status: 'PAID',
            cashfreePaymentId: paymentId || `cf_wh_${Date.now()}`,
            paidAt: paidDate
          }
        });

        await prisma.feePayment.updateMany({
          where: {
            OR: [
              { paymentOrderId: paymentOrder.id },
              { cashfreeOrderId: orderId }
            ]
          },
          data: {
            status: 'PAID',
            cashfreePaymentId: paymentId || `cf_wh_${Date.now()}`,
            paidAt: paidDate,
            paymentMethod: 'CASHFREE_UPI'
          }
        });

        console.log(`Webhook successfully processed order ${orderId}`);
      }
    }

    return NextResponse.json({ status: "OK" });
  } catch (error) {
    console.error("Cashfree webhook handler error:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
