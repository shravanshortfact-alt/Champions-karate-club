import { getPrisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export const runtime = 'edge';



const prisma = getPrisma();

export async function POST(request: Request) {
  try {
    const { recipientId } = await request.json();

    if (!recipientId) {
      return NextResponse.json({ success: false, error: "Recipient ID is required" }, { status: 400 });
    }

    const updated = await prisma.notificationRecipient.update({
      where: { id: recipientId },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return NextResponse.json({ success: true, notification: updated });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json({ success: false, error: "Failed to mark as read" }, { status: 500 });
  }
}
