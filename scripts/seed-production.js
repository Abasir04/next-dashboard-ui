// Seed production database with existing courses
// Run this ONLY when connected to production database

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedProduction() {
  console.log('⚠️  WARNING: This will create courses in your CURRENT database');
  console.log('   Make sure DATABASE_URL points to PRODUCTION!\n');
  
  try {
    // First, check which database we're connected to
    const dbInfo = await prisma.$queryRaw`SELECT current_database()`;
    console.log('📡 Connected to database:', dbInfo[0].current_database);
    console.log('');
    
    // Find the lecturer by email (adjust this to match your production lecturer)
    const lecturerEmail = 'adiadebayo1@gmail.com'; // Change this to your production email
    
    const lecturer = await prisma.lecturer.findUnique({
      where: { email: lecturerEmail },
      select: { id: true, name: true, email: true },
    });
    
    if (!lecturer) {
      console.error(`❌ Lecturer not found: ${lecturerEmail}`);
      console.error('   Make sure the lecturer exists in production database');
      return;
    }
    
    console.log(`✅ Found lecturer: ${lecturer.name} (ID: ${lecturer.id})\n`);
    
    // Courses to create
    const coursesToCreate = [
      { name: 'Theory of Computation', code: 'CSC551', level: 500 },
      { name: 'Object Oriented Languages', code: 'CSC533', level: 500 },
      { name: 'HCI', code: 'CSC451', level: 400 },
      { name: 'Algorithmy', code: 'CSC324', level: 300 },
      { name: 'Algorithm', code: 'CSC354', level: 300 },
      { name: 'Test for delete', code: 'CSC123', level: 100 },
    ];
    
    console.log(`📚 Creating ${coursesToCreate.length} courses...\n`);
    
    for (const courseData of coursesToCreate) {
      try {
        // Check if course already exists
        const existing = await prisma.course.findUnique({
          where: { code: courseData.code },
        });
        
        if (existing) {
          console.log(`⏭️  Skipped: ${courseData.name} (${courseData.code}) - already exists`);
          continue;
        }
        
        const course = await prisma.course.create({
          data: {
            ...courseData,
            lecturerId: lecturer.id,
          },
        });
        
        console.log(`✅ Created: ${course.name} (${course.code}) - ID: ${course.id}`);
      } catch (error) {
        console.error(`❌ Failed to create ${courseData.name}:`, error.message);
      }
    }
    
    console.log('\n✨ Seeding complete!');
    
    // Show final count
    const totalCourses = await prisma.course.count();
    console.log(`\n📊 Total courses in database: ${totalCourses}`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

console.log('='.repeat(80));
console.log('  PRODUCTION DATABASE SEEDER');
console.log('='.repeat(80));
console.log('');

seedProduction();

