const { PrismaClient } = require('@prisma/client');

async function setupSupabase() {
  console.log('🗄️ Setting up Supabase database...');
  
  const prisma = new PrismaClient();
  
  try {
    // Test connection
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully!');
    
    // Run migrations
    console.log('Running database migrations...');
    await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;
    console.log('✅ Extensions created');
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`✅ Database is ready! Found ${userCount} users.`);
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupSupabase()
  .then(() => {
    console.log('🎉 Supabase setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });
