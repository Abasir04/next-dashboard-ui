# Database Connection Troubleshooting Guide

## Current Issue: P5010 Errors (Both Local & Production)

The error `P5010 - Cannot fetch data from service: fetch failed` means Prisma cannot connect to your database server.

## Quick Diagnosis

### Step 1: Check if Your Database is Running

#### For PostgreSQL (Local):

```bash
# Windows (if using PostgreSQL service)
pg_ctl status

# OR check if PostgreSQL is running
netstat -an | findstr :5432

# If using Docker
docker ps | findstr postgres
```

#### For Supabase (Production):

- Go to your Supabase dashboard
- Check if the project is active and not paused
- Supabase pauses inactive projects after 7 days on free tier

### Step 2: Verify Your DATABASE_URL

Check your `.env.local` file (for local development):

```bash
# Should look like this:
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

# Example for local PostgreSQL:
DATABASE_URL="postgresql://postgres:password@localhost:5432/lecturer_dashboard?schema=public"

# Example for Supabase:
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

## Solutions by Environment

### Local Development

#### Option 1: Using Docker (Recommended)

If you have Docker installed:

```bash
# Create a docker-compose.yml file
version: '3.8'
services:
  postgres:
    image: postgres:15
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: lecturer_dashboard
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Then run:

```bash
docker-compose up -d
```

Update your `.env.local`:

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/lecturer_dashboard?schema=public"
```

#### Option 2: Using Installed PostgreSQL

If you have PostgreSQL installed locally:

1. **Start PostgreSQL Service:**

   ```bash
   # Windows (as Administrator)
   net start postgresql-x64-15

   # Or using pg_ctl
   pg_ctl -D "C:\Program Files\PostgreSQL\15\data" start
   ```

2. **Create Database:**

   ```bash
   # Open psql
   psql -U postgres

   # In psql:
   CREATE DATABASE lecturer_dashboard;
   \q
   ```

3. **Update .env.local:**
   ```bash
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/lecturer_dashboard?schema=public"
   ```

#### Option 3: Use Supabase for Both (Easiest)

Just use your Supabase database for local development too:

```bash
# .env.local
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
```

### Production (Supabase/Other Hosted DB)

#### 1. Check Database Status

- Login to your database provider dashboard
- Verify the database is active (not paused/stopped)
- Check for any alerts or maintenance notifications

#### 2. Update Connection String with Pooling

For **Supabase**, use the connection pooling string:

```bash
# In Supabase Dashboard:
# Settings → Database → Connection Pooling → Connection String

# Format:
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
```

Add connection parameters:

```bash
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10"
```

#### 3. For Vercel Deployment

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update `DATABASE_URL` with the pooling connection string
3. Click "Redeploy" (don't just save - you must redeploy)

## After Fixing Connection

### 1. Run Prisma Migrations

Once database is connected:

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database (for development)
npx prisma db push

# OR run migrations (for production)
npx prisma migrate deploy
```

### 2. Verify Connection

Create a test script to verify connection:

```typescript
// scripts/test-db-connection.ts
import { prisma } from "../src/lib/prisma";

async function testConnection() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ Query executed successfully:", result);

    await prisma.$disconnect();
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
}

testConnection();
```

Run it:

```bash
npx ts-node scripts/test-db-connection.ts
```

### 3. Restart Development Server

After fixing the connection:

```bash
# Stop the server (Ctrl+C)
# Clear Next.js cache
rm -rf .next

# Restart
npm run dev
```

## Common Causes and Fixes

### Error: "Connection refused" or "ECONNREFUSED"

**Cause**: Database server not running
**Fix**: Start your database service (see Step 1 above)

### Error: "authentication failed"

**Cause**: Wrong username/password in DATABASE_URL
**Fix**: Check credentials in database dashboard and update .env

### Error: "database does not exist"

**Cause**: Database not created
**Fix**: Create the database using psql or your database provider's dashboard

### Error: "too many connections"

**Cause**: Too many connections to database
**Fix**:

- Add `connection_limit=10` to DATABASE_URL
- Use connection pooling (pgbouncer for Supabase)
- Close unused connections

### Error: P5010 intermittently

**Cause**: Database goes to sleep (Supabase free tier)
**Fix**:

- Upgrade to paid plan
- Use connection pooling
- Keep database active with scheduled pings

## Environment-Specific Tips

### Local Development (.env.local)

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/lecturer_dashboard?schema=public"
JWT_SECRET="your-local-secret-at-least-32-chars"
NODE_ENV="development"
```

### Production (Vercel Environment Variables)

```bash
DATABASE_URL="postgresql://postgres.[REF]:[PWD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10"
JWT_SECRET="your-production-secret-at-least-32-chars"
NODE_ENV="production"
```

## Next Steps

1. ✅ Fix database connection (choose one option above)
2. ✅ Run `npx prisma generate`
3. ✅ Run `npx prisma db push` (local) or `npx prisma migrate deploy` (production)
4. ✅ Restart your development server
5. ✅ Test creating and fetching courses

## Still Having Issues?

Run this diagnostic command:

```bash
# Test Prisma connection
npx prisma studio

# If Prisma Studio opens, your connection works!
# If not, check the error message for clues
```

Check your logs for:

- The actual DATABASE_URL being used (make sure .env.local is loaded)
- Any error messages about SSL, certificates, or network
- Firewall blocking port 5432 or 6543

---

**Last Updated**: October 28, 2025
