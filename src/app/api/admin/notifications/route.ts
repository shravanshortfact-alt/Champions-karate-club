import { getPrisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

import webpush from 'web-push';

export const runtime = 'edge';


const prisma = getPrisma();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: skip,
      include: {
        _count: {
          select: { recipients: true }
        }
      }
    });

    const total = await prisma.notification.count();

    return NextResponse.json({ success: true, notifications, total });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, message, type, priority, actionUrl, imageUrl, targetAudience, specificStudentIds } = body;

    if (!title || !message) {
      return NextResponse.json({ success: false, error: "Title and message are required" }, { status: 400 });
    }

    // Determine target students
    let studentsToNotify: any[] = [];
    
    if (targetAudience === 'All') {
      studentsToNotify = await prisma.student.findMany({
        where: { status: 'Active' },
        select: { id: true }
      });
    } else if (targetAudience === 'Specific' && Array.isArray(specificStudentIds)) {
      studentsToNotify = specificStudentIds.map((id: string) => ({ id }));
    }

    if (type === 'Fee Reminder') {
      const today = new Date();
      const currentMonthIndex = today.getMonth();
      const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const currentMonth = MONTHS[currentMonthIndex];
      const currentYear = today.getFullYear();

      // Find all students who HAVE paid for the current month
      const paidStudents = await prisma.feePayment.findMany({
        where: {
          month: currentMonth,
          year: currentYear,
          studentId: { in: studentsToNotify.map(s => s.id) }
        },
        select: { studentId: true }
      });

      const paidStudentIds = new Set(paidStudents.map(p => p.studentId));
      
      // Filter out students who have paid
      studentsToNotify = studentsToNotify.filter(s => !paidStudentIds.has(s.id));
    }

    if (studentsToNotify.length === 0) {
      return NextResponse.json({ success: false, error: "No target students found" }, { status: 400 });
    }

    // Create Notification and Link Recipients
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type: type || 'General',
        priority: priority || 'Normal',
        actionUrl,
        imageUrl,
        status: 'Sent',
        sentAt: new Date(),
        recipients: {
          create: studentsToNotify.map(student => ({
            studentId: student.id
          }))
        }
      },
      include: {
        _count: { select: { recipients: true } }
      }
    });

    // Fetch push subscriptions for targeted students
    const studentIds = studentsToNotify.map(s => s.id);
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { studentId: { in: studentIds } }
    });

    if (subscriptions.length > 0) {
      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

      if (!publicVapidKey || !privateVapidKey) {
        console.warn('VAPID keys are missing. Push notifications skipped. (Restart server to load .env)');
      } else {
        webpush.setVapidDetails(
          'mailto:admin@championskarate.com',
          publicVapidKey,
          privateVapidKey
        );

        const pushPayload = JSON.stringify({
          title: title,
          body: message,
          url: actionUrl || '/student',
          icon: imageUrl || '/favicon.ico'
        });

        // Send push notifications in parallel
        await Promise.all(subscriptions.map(async (sub) => {
          try {
            await webpush.sendNotification({
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth }
            }, pushPayload);
          } catch (err: any) {
            // If subscription has expired/revoked, delete it from DB
            if (err.statusCode === 410 || err.statusCode === 404) {
              await prisma.pushSubscription.delete({ where: { id: sub.id } });
            } else {
              console.error('Web Push Error:', err);
            }
          }
        }));
      }
    }

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json({ success: false, error: "Failed to create notification" }, { status: 500 });
  }
}
