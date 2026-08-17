import { getPrisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export const runtime = 'edge';



const prisma = getPrisma();

export async function POST(request: Request) {
  try {
    const { subscription, studentId } = await request.json();

    if (!subscription || !subscription.endpoint || !studentId) {
      return NextResponse.json({ success: false, error: 'Invalid subscription data' }, { status: 400 });
    }

    const { endpoint, keys } = subscription;
    const p256dh = keys?.p256dh || '';
    const auth = keys?.auth || '';

    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint }
    });

    if (existing) {
      if (existing.studentId !== studentId) {
        await prisma.pushSubscription.update({
          where: { endpoint },
          data: { studentId }
        });
      }
      return NextResponse.json({ success: true, message: 'Subscription updated' });
    }

    await prisma.pushSubscription.create({
      data: { studentId, endpoint, p256dh, auth }
    });

    return NextResponse.json({ success: true, message: 'Subscription saved' });
  } catch (error) {
    console.error('Push Subscribe Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
