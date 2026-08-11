export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const registrations = await prisma.registration.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(registrations);
  } catch (error) {
    console.error("Error fetching registrations:", error);
    return NextResponse.json({ error: "Failed to load registrations" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newRegistration = await request.json();
    
    // Add missing metadata
    const idPrefix = newRegistration.category === 'Admission' ? 'CKC' : 
                     newRegistration.category === 'Belt Exam' ? 'EXM' : 
                     newRegistration.category === 'Competition' ? 'CMP' : 'SEM';
                     
    const id = `${idPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    const month = new Date().toLocaleString('en-US', { month: 'long' });

    const registration = await prisma.registration.create({
      data: {
        id,
        category: newRegistration.category || '',
        name: newRegistration.name || '',
        age: newRegistration.age || '',
        branch: newRegistration.branch || '',
        profilePhotoUrl: newRegistration.profilePhotoUrl || '',
        dob: newRegistration.dob || '',
        whatsappNumber: newRegistration.whatsappNumber || '',
        appearingBelt: newRegistration.appearingBelt || '',
        status: 'Pending',
        month,
        extraData: JSON.stringify(newRegistration)
      }
    });

    // Automatic Belt Upgrade if it's a Belt Exam
    if (newRegistration.category === 'Belt Exam' && newRegistration.name && newRegistration.appearingBelt) {
      try {
        const student = await prisma.student.findFirst({
          where: { name: newRegistration.name, status: 'Active' }
        });
        
        if (student) {
          await prisma.student.update({
            where: { id: student.id },
            data: { currentBelt: newRegistration.appearingBelt }
          });
        }
      } catch (e) {
        console.error("Failed to automatically upgrade belt in Prisma", e);
      }
    }

    return NextResponse.json({ success: true, id: registration.id });
  } catch (error) {
    console.error("Error saving registration:", error);
    return NextResponse.json({ error: "Failed to save registration" }, { status: 500 });
  }
}
