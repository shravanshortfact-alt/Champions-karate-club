import { getPrisma, getD1 } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  const d1 = getD1();
  const rawBodyText = await request.text();
  const bodyText = rawBodyText.replace(/^\uFEFF/, '').trim();

  // Forward to Cloudflare Worker if running in environment without D1 (e.g. Vercel)
  if (!d1 && process.env.NODE_ENV === 'production') {
    try {
      const res = await fetch(`https://karate-club.shravanshortfact.workers.dev/api/registrations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: bodyText || '{}'
      });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch (err: any) {
      console.error("Failed to forward PATCH registration to Cloudflare Worker:", err);
    }
  }

  // Safely parse body if present
  let body: any = {};
  if (bodyText) {
    try {
      body = JSON.parse(bodyText);
    } catch (e) {}
  }

  // 1. Direct D1 execution
  if (d1) {
    try {
      const registration: any = await d1.prepare("SELECT * FROM Registration WHERE id = ?").bind(id).first();
      if (!registration) {
        return NextResponse.json({ error: "Registration not found" }, { status: 404 });
      }

      let extraData: any = {};
      try {
        extraData = JSON.parse(registration.extraData || '{}');
      } catch(e) {}

      const selectedBelt = body.currentBelt || body.belt || registration.appearingBelt || extraData.currentBelt || extraData.belt || 'White Belt';
      extraData.currentBelt = selectedBelt;
      extraData.belt = selectedBelt;

      const newStatus = body.status || 'Verified';

      await d1.prepare("UPDATE Registration SET status = ?, appearingBelt = ?, extraData = ? WHERE id = ?")
        .bind(newStatus, selectedBelt, JSON.stringify(extraData), id).run();

      const reg = {
        id: registration.id,
        category: registration.category,
        name: registration.name,
        age: registration.age,
        branch: registration.branch,
        profilePhotoUrl: registration.profilePhotoUrl,
        dob: registration.dob,
        whatsappNumber: registration.whatsappNumber,
        appearingBelt: selectedBelt,
        currentBelt: selectedBelt,
        generatedPassword: extraData.generatedPassword || ''
      };

      try {
        if (reg.category === 'Admission' && reg.name) {
          let branch: any = await d1.prepare("SELECT id FROM Branch WHERE name = ?").bind(reg.branch || 'Main Branch').first();
          let branchId = branch?.id;
          if (!branchId) {
            branchId = 'branch_' + Date.now();
            await d1.prepare("INSERT INTO Branch (id, name, address, isArchived) VALUES (?, ?, '', 0)")
              .bind(branchId, reg.branch || 'Main Branch').run();
          }

          const existingStudent: any = await d1.prepare("SELECT id FROM Student WHERE registrationNumber = ?").bind(reg.id).first();

          if (existingStudent) {
            if (reg.profilePhotoUrl) {
              await d1.prepare("UPDATE Student SET currentBelt = ?, profilePhotoUrl = ? WHERE id = ?")
                .bind(selectedBelt, reg.profilePhotoUrl, existingStudent.id).run();
            } else {
              await d1.prepare("UPDATE Student SET currentBelt = ? WHERE id = ?")
                .bind(selectedBelt, existingStudent.id).run();
            }
          } else if (newStatus === 'Verified') {
            const generatedPassword = Math.floor(100000 + Math.random() * 900000).toString();
            reg.generatedPassword = generatedPassword;
            extraData.generatedPassword = generatedPassword;
            await d1.prepare("UPDATE Registration SET extraData = ? WHERE id = ?")
              .bind(JSON.stringify(extraData), id).run();

            const studentId = 'std_' + Date.now() + '_' + Math.floor(1000 + Math.random() * 9000);
            await d1.prepare(`
              INSERT INTO Student (id, registrationNumber, name, age, branchId, currentBelt, profilePhotoUrl, dob, whatsappNumber, password, status, totalPoints, paymentStatus, monthlyFee, createdAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', 0, 'Pending', 700, ?)
            `).bind(
              studentId,
              reg.id,
              reg.name,
              parseInt(reg.age || '0') || 0,
              branchId,
              selectedBelt,
              reg.profilePhotoUrl || null,
              reg.dob || null,
              reg.whatsappNumber || null,
              generatedPassword,
              new Date().toISOString()
            ).run();
          }
        } else if (reg.name) {
          const student: any = await d1.prepare("SELECT id FROM Student WHERE name = ? AND status = 'Active'").bind(reg.name).first();
          if (student) {
            if (reg.category === 'Belt Exam' && (body.currentBelt || reg.appearingBelt)) {
              await d1.prepare("UPDATE Student SET currentBelt = ? WHERE id = ?").bind(body.currentBelt || reg.appearingBelt, student.id).run();
            }
            if (reg.profilePhotoUrl) {
              await d1.prepare("UPDATE Student SET profilePhotoUrl = ? WHERE id = ?").bind(reg.profilePhotoUrl, student.id).run();
            }
          }
        }
      } catch (e) {
        console.error("Failed to sync student with D1", e);
      }

      return NextResponse.json({ 
        success: true, 
        registration: { ...reg, status: newStatus },
        generatedPassword: reg.generatedPassword,
        studentName: reg.name,
        whatsappNumber: reg.whatsappNumber,
        studentId: reg.id,
        currentBelt: selectedBelt
      });
    } catch (error: any) {
      console.error("D1 error updating registration:", error);
      return NextResponse.json({ 
        error: "Failed to update registration in D1", 
        message: error?.message || String(error) 
      }, { status: 500 });
    }
  }

  // 2. Prisma fallback
  try {
    const prisma = getPrisma();
    const registration = await prisma.registration.findUnique({ where: { id } });
    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    let extraData: any = {};
    try {
      extraData = JSON.parse(registration.extraData || '{}');
    } catch(e) {}

    const selectedBelt = body.currentBelt || body.belt || registration.appearingBelt || extraData.currentBelt || extraData.belt || 'White Belt';
    extraData.currentBelt = selectedBelt;
    extraData.belt = selectedBelt;

    const newStatus = body.status || 'Verified';

    await prisma.registration.update({
      where: { id },
      data: { 
        status: newStatus,
        appearingBelt: selectedBelt,
        extraData: JSON.stringify(extraData)
      }
    });

    const reg = {
      id: registration.id,
      category: registration.category,
      name: registration.name,
      age: registration.age,
      branch: registration.branch,
      profilePhotoUrl: registration.profilePhotoUrl,
      dob: registration.dob,
      whatsappNumber: registration.whatsappNumber,
      appearingBelt: selectedBelt,
      currentBelt: selectedBelt,
      generatedPassword: extraData.generatedPassword || ''
    };

    try {
      if (reg.category === 'Admission' && reg.name) {
        const branch = await prisma.branch.findFirst({ where: { name: reg.branch || 'Main Branch' } });
        let branchId = branch?.id;
        if (!branchId) {
          const newBranch = await prisma.branch.create({ data: { name: reg.branch || 'Main Branch', address: '' } });
          branchId = newBranch.id;
        }

        const existingStudent = await prisma.student.findUnique({
          where: { registrationNumber: reg.id }
        });

        if (existingStudent) {
          await prisma.student.update({
            where: { id: existingStudent.id },
            data: {
              currentBelt: selectedBelt,
              ...(reg.profilePhotoUrl ? { profilePhotoUrl: reg.profilePhotoUrl } : {})
            }
          });
        } else if (newStatus === 'Verified') {
          const generatedPassword = Math.floor(100000 + Math.random() * 900000).toString();
          reg.generatedPassword = generatedPassword;

          extraData.generatedPassword = generatedPassword;
          await prisma.registration.update({
            where: { id },
            data: { extraData: JSON.stringify(extraData) }
          });

          await prisma.student.create({
            data: {
              registrationNumber: reg.id,
              name: reg.name,
              age: parseInt(reg.age || '0') || 0,
              branchId: branchId,
              currentBelt: selectedBelt,
              profilePhotoUrl: reg.profilePhotoUrl || null,
              dob: reg.dob || null,
              whatsappNumber: reg.whatsappNumber || null,
              password: generatedPassword
            }
          });
        }
      } else if (reg.name) {
        const student = await prisma.student.findFirst({
          where: { name: reg.name, status: 'Active' }
        });
        
        if (student) {
          const updateData: any = {};
          if (reg.category === 'Belt Exam' && (body.currentBelt || reg.appearingBelt)) {
            updateData.currentBelt = body.currentBelt || reg.appearingBelt;
          }
          if (reg.profilePhotoUrl) {
            updateData.profilePhotoUrl = reg.profilePhotoUrl;
          }
          
          if (Object.keys(updateData).length > 0) {
            await prisma.student.update({
              where: { id: student.id },
              data: updateData
            });
          }
        }
      }
    } catch (e) {
      console.error("Failed to sync with Prisma", e);
    }

    return NextResponse.json({ 
      success: true, 
      registration: { ...reg, status: newStatus },
      generatedPassword: reg.generatedPassword,
      studentName: reg.name,
      whatsappNumber: reg.whatsappNumber,
      studentId: reg.id,
      currentBelt: selectedBelt
    });
  } catch (error) {
    console.error("Error updating registration:", error);
    return NextResponse.json({ error: "Failed to update registration" }, { status: 500 });
  }
}
