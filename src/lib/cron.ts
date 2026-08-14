import { getPrisma } from '@/lib/prisma';
import cron from 'node-cron';

import webpush from 'web-push';

const prisma = getPrisma();

// Only set VAPID details if they exist to prevent crashing during build or missing env vars
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@championskarate.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function startFeeReminderCron() {
  console.log("Starting fee reminder cron job...");
  
  // Run every day at 10:00 AM
  cron.schedule('0 10 * * *', async () => {
    try {
      const today = new Date();
      
      // We only want to send notifications on the 10th of the month
      if (today.getDate() !== 10) {
        return;
      }
      
      console.log("Running fee reminder check for the 10th of the month...");
      
      const currentMonth = MONTHS[today.getMonth()];
      const currentYear = today.getFullYear();
      
      // Get all active students
      const students = await prisma.student.findMany({
        where: { status: 'Active' },
        include: {
          feePayments: {
            where: {
              month: currentMonth,
              year: currentYear
            }
          },
          pushSubscriptions: true
        }
      });
      
      const unpaidStudents = students.filter(s => s.feePayments.length === 0);
      
      if (unpaidStudents.length === 0) {
        console.log("No students need fee reminders today.");
        return;
      }

      const messageTitle = "Fee Reminder";
      
      // 1. Create a single notification record for all
      const notification = await prisma.notification.create({
        data: {
          title: messageTitle,
          message: `This is a gentle reminder that your fees for ${currentMonth} are due. Please submit them at your earliest convenience.`,
          type: 'Fee Reminder',
          status: 'Sent',
          sentAt: new Date()
        }
      });
      
      let reminderCount = 0;
      
      for (const student of unpaidStudents) {
        const messageBody = `Dear ${student.name}, this is a gentle reminder that your fees for ${currentMonth} are due. Please submit them at your earliest convenience.`;
        
        // 2. Link student to notification
        await prisma.notificationRecipient.create({
          data: {
            studentId: student.id,
            notificationId: notification.id
          }
        });
        
        // 3. Send push notifications
        if (student.pushSubscriptions && student.pushSubscriptions.length > 0) {
          for (const sub of student.pushSubscriptions) {
            const pushSubscription = {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth
              }
            };
            
            try {
              await webpush.sendNotification(
                pushSubscription, 
                JSON.stringify({
                  title: messageTitle,
                  body: messageBody,
                  icon: '/favicon.ico',
                  badge: '/favicon.ico'
                })
              );
            } catch (pushErr: any) {
              if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
                await prisma.pushSubscription.delete({ where: { id: sub.id } });
              } else {
                console.error(`Error sending push to ${student.name}:`, pushErr);
              }
            }
          }
        }
        reminderCount++;
      }
      
      console.log(`Automated Fee Reminders sent to ${reminderCount} students.`);
    } catch (error) {
      console.error("Error in fee reminder cron job:", error);
    }
  });
}
