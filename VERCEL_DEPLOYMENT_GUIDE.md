# 🚀 Vercel Deployment Guide for Lecturer Dashboard

This guide will help you deploy your Next.js lecturer dashboard to Vercel.

## 📋 Prerequisites

1. **GitHub Repository**: Your code must be pushed to GitHub
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **MySQL Database**: You'll need a hosted MySQL database (PlanetScale, Supabase, Neon, etc.)
4. **Backblaze B2 Account**: For file storage

## 🗄️ Database Setup

### Option 1: PlanetScale (Recommended)

1. Go to [planetscale.com](https://planetscale.com)
2. Create a new database
3. Get your connection string
4. Run migrations: `npx prisma db push`

### Option 2: Supabase

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string
5. Run migrations: `npx prisma db push`

### Option 3: Neon

1. Go to [neon.tech](https://neon.tech)
2. Create a new database
3. Copy the connection string
4. Run migrations: `npx prisma db push`

## 🔧 Environment Variables

Create a `.env.local` file with these variables:

```env
# Database Configuration
DATABASE_URL="mysql://username:password@host:port/database_name"

# JWT Secret (generate a strong secret)
JWT_SECRET="your-super-secure-jwt-secret-key-here"

# Backblaze B2 Configuration
S3_ENDPOINT="https://s3.eu-central-003.backblazeb2.com"
S3_REGION="eu-central-003"
S3_ACCESS_KEY_ID="your-backblaze-access-key-id"
S3_SECRET_ACCESS_KEY="your-backblaze-secret-access-key"
S3_BUCKET="Lecturer-Dashboard"
S3_PUBLIC_BASE_URL="https://f004.backblazeb2.com/file/Lecturer-Dashboard"

# Next.js Public URL (will be set automatically by Vercel)
NEXT_PUBLIC_BASE_URL="https://your-app-name.vercel.app"
```

## 🚀 Deployment Steps

### Method 1: Using Vercel Dashboard (Recommended)

1. **Push to GitHub**

   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel**

   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables**

   - Go to Project Settings → Environment Variables
   - Add all variables from your `.env.local`
   - Set them for Production, Preview, and Development

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be available at `https://your-app-name.vercel.app`

### Method 2: Using Vercel CLI

1. **Install Vercel CLI**

   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**

   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

## 🗃️ Database Migration

After deployment, you need to run database migrations on your production database:

```bash
# Set your production DATABASE_URL
export DATABASE_URL="your-production-database-url"

# Run migrations
npx prisma db push

# Seed the database (optional)
npm run db:seed
```

## 🔍 Post-Deployment Checklist

- [ ] Environment variables are set in Vercel
- [ ] Database is connected and migrations are run
- [ ] Backblaze B2 is configured correctly
- [ ] Test file uploads work
- [ ] Test authentication works
- [ ] Test all API endpoints
- [ ] Test student registration links

## 🐛 Troubleshooting

### Build Errors

- Check that all dependencies are in `package.json`
- Ensure TypeScript errors are fixed
- Check that all imports are correct

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check that your database allows external connections
- Ensure SSL is properly configured

### File Upload Issues

- Verify Backblaze B2 credentials
- Check S3 bucket permissions
- Ensure `S3_PUBLIC_BASE_URL` is correct

### API Route Issues

- Check that API routes are in the correct directory structure
- Verify that all environment variables are available
- Check Vercel function logs for errors

## 📊 Monitoring

- **Vercel Dashboard**: Monitor deployments and performance
- **Function Logs**: Check API route errors
- **Database Logs**: Monitor database performance

## 🔄 Continuous Deployment

Once set up, Vercel will automatically deploy when you push to your main branch. For other branches, it will create preview deployments.

## 📞 Support

If you encounter issues:

1. Check Vercel function logs
2. Check your database connection
3. Verify all environment variables
4. Test locally with `vercel dev`

---

**Happy Deploying! 🎉**
