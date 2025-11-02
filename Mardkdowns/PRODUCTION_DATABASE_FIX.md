# Production Database Connection Issues - Fix Guide

## Problem

Courses created by lecturers are not being returned from the database in production. Database connection errors (Prisma P5010).

## Root Causes

1. **Database Connection Pooling**: Production environments need proper connection pooling
2. **Database URL Format**: The DATABASE_URL must include connection pooling parameters
3. **Timeout Issues**: Default timeouts may be too short for production databases
4. **Environment Variables**: Missing or incorrectly configured in production

## Solutions Implemented

### 1. Updated Prisma Client Configuration

- Added proper logging for production
- Enhanced error reporting
- File: `src/lib/prisma.ts`

### 2. Enhanced API Route Logging

- Added detailed logging to track request flow
- Better error messages for debugging
- File: `src/app/api/lecturers/courses/route.ts`

## Production Deployment Steps

### Step 1: Update DATABASE_URL in Production

Your production `DATABASE_URL` should include connection pooling parameters. Update your environment variable:

```bash
# For Supabase (recommended format)
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres?pgbouncer=true&connection_limit=10"

# OR with connection pooling parameters
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres?connection_limit=10&pool_timeout=20"
```

**Key Parameters:**

- `pgbouncer=true` - Use PgBouncer for connection pooling (if using Supabase)
- `connection_limit=10` - Limit concurrent connections
- `pool_timeout=20` - Connection pool timeout in seconds

### Step 2: Environment Variables Checklist

Ensure these are set in your production environment (Vercel, Railway, etc.):

```bash
# Required
DATABASE_URL=your_production_database_url_with_pooling
JWT_SECRET=your_production_jwt_secret
NODE_ENV=production

# Optional but recommended
PRISMA_CLIENT_ENGINE_TYPE=binary
```

### Step 3: Verify Prisma Generate

After updating environment variables, regenerate Prisma client:

```bash
# In production environment or locally before deployment
npx prisma generate
```

### Step 4: For Vercel Deployment

If deploying to Vercel:

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add/update `DATABASE_URL` with the connection pooling format
4. **Redeploy** your application

### Step 5: For Database Providers

#### Supabase

1. Go to your Supabase project settings
2. Navigate to **Database** → **Connection Pooling**
3. Enable connection pooling
4. Use the **Connection Pooling** connection string (not the direct connection string)
5. It should look like: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`

#### Railway/Other Providers

1. Check if your provider offers connection pooling
2. Update the `DATABASE_URL` to include `connection_limit` and `pool_timeout` parameters

## Testing the Fix

### 1. Check Logs in Production

After deploying, check your production logs for the new log messages:

```
GET /api/lecturers/courses - Fetching lecturer for userId: X
GET /api/lecturers/courses - Fetching courses for lecturerId: X
GET /api/lecturers/courses - Found X courses for lecturerId: X
```

### 2. Test Course Creation and Retrieval

1. Create a course in production
2. Immediately try to fetch courses for that lecturer
3. Check if the newly created course appears

### 3. Monitor for Errors

Watch for these specific errors in production logs:

- `P5010` - Database connection errors
- `P2024` - Connection pool timeout
- `P1001` - Can't reach database

## Additional Optimizations

### 1. Add Connection Retry Logic

For critical queries, consider adding retry logic:

```typescript
async function fetchWithRetry<T>(
  operation: () => Promise<T>,
  retries = 3
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error("Max retries reached");
}
```

### 2. Database Connection Health Check

Add a health check endpoint to monitor database connectivity:

```typescript
// app/api/health/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "healthy", database: "connected" });
  } catch (error) {
    return NextResponse.json(
      { status: "unhealthy", database: "disconnected", error: String(error) },
      { status: 500 }
    );
  }
}
```

## Common Issues and Solutions

### Issue 1: "Too many connections"

**Solution**: Reduce `connection_limit` in DATABASE_URL or enable connection pooling

### Issue 2: "Connection timeout"

**Solution**: Increase `pool_timeout` or `connect_timeout` in DATABASE_URL

### Issue 3: "SSL connection error"

**Solution**: Add `sslmode=require` to DATABASE_URL:

```
DATABASE_URL="...?sslmode=require&connection_limit=10"
```

### Issue 4: Courses created but not returned

**Solution**:

1. Check if `lecturerId` is being set correctly when creating courses
2. Verify the lecturer profile exists in the database
3. Check database transaction isolation levels

## Verification Query

Run this directly in your database to check if courses exist:

```sql
-- Check if lecturer profile exists
SELECT id, name, email, userId FROM lecturers WHERE email = 'your-email@example.com';

-- Check courses for a specific lecturer
SELECT c.id, c.name, c.code, c.level, c.lecturerId
FROM courses c
WHERE c.lecturerId = YOUR_LECTURER_ID;

-- Check if lecturer foreign key is set correctly
SELECT c.*, l.name as lecturer_name
FROM courses c
LEFT JOIN lecturers l ON c.lecturerId = l.id
WHERE c.lecturerId = YOUR_LECTURER_ID;
```

## Next Steps

1. Deploy these changes to production
2. Monitor logs for the new debug messages
3. Test course creation and retrieval
4. If issues persist, check the production logs for specific error messages
5. Verify database connection string in production environment

## Support

If issues continue:

1. Check production logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test database connection with the health check endpoint
4. Check database provider status/limits

---

**Last Updated**: October 28, 2025
**Related Files**:

- `src/lib/prisma.ts`
- `src/app/api/lecturers/courses/route.ts`
- `src/app/api/courses/route.ts`
