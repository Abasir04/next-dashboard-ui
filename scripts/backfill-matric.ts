import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting matricNumber backfill...");

  // Backfill students.matricNumber where null
  const students = await prisma.student.findMany({
    // Field is non-nullable in schema, but legacy rows may contain NULLs in DB
    // Cast to any to allow filtering for NULLs at runtime
    where: { matricNumber: { equals: null } } as any,
  });
  console.log(`Students without matricNumber: ${students.length}`);
  for (const student of students) {
    const matric = String(100000 + student.id).slice(-6);
    await prisma.student.update({
      where: { id: student.id },
      data: { matricNumber: matric },
    });
  }

  // Backfill course_registrations.matricNumber where null
  const regs = await prisma.courseRegistration.findMany({
    where: { matricNumber: { equals: null } } as any,
  });
  console.log(`Course registrations without matricNumber: ${regs.length}`);
  for (const reg of regs) {
    // Try to map by email to an existing student
    const student = await prisma.student.findFirst({
      where: { email: reg.studentEmail },
    });
    const matric = student?.matricNumber || String(900000 + reg.id).slice(-6);
    await prisma.courseRegistration.update({
      where: { id: reg.id },
      data: { matricNumber: matric },
    });
  }

  console.log("Backfill complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
