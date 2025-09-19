import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting levels-only database seeding...");

  // Clear existing data
  console.log("🧹 Clearing existing data...");
  await prisma.calendarEvent.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.event.deleteMany();
  await prisma.result.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.student.deleteMany();
  await prisma.lecturer.deleteMany();
  await prisma.course.deleteMany();
  await prisma.level.deleteMany();
  await prisma.user.deleteMany();

  // Create only levels for 100-600 levels
  console.log("🏫 Creating levels for 100-600 system...");
  const levels = [
    // 100 Level
    {
      id: 1,
      name: "100",
      capacity: 150,
    },

    // 200 Level
    {
      id: 2,
      name: "200",
      capacity: 150,
    },

    // 300 Level
    {
      id: 3,
      name: "300",
      capacity: 150,
    },

    // 400 Level
    {
      id: 4,
      name: "400",
      capacity: 150,
    },

    // 500 Level
    {
      id: 5,
      name: "500",
      capacity: 150,
    },

    // 600 Level
    {
      id: 6,
      name: "600",
      capacity: 150,
    },
  ];

  const createdLevels = await Promise.all(
    levels.map((lvl) => prisma.level.create({ data: lvl }))
  );

  console.log("✅ Levels-only seeding completed successfully!");
  console.log("📊 Created levels:");
  createdLevels.forEach((level) => {
    console.log(
      `  - ID: ${level.id}, Level: ${level.name} (Capacity: ${level.capacity})`
    );
  });
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
