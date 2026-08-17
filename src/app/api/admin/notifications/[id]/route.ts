import { getPrisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const runtime = 'edge';



const prisma = getPrisma();

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: "Notification ID is required" }, { status: 400 });
    }

    await prisma.notification.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json({ success: false, error: "Failed to delete notification" }, { status: 500 });
  }
}
