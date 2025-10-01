#!/bin/bash

# Vercel Deployment Script for Lecturer Dashboard
# Run this script to prepare and deploy your project to Vercel

echo "🚀 Starting Vercel deployment process..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if project is in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not a git repository. Please initialize git first:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found. Please create it with your environment variables."
    echo "   You can use env.production.example as a template."
    exit 1
fi

echo "✅ Prerequisites check passed!"

# Build the project locally to check for errors
echo "🔨 Building project locally..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors before deploying."
    exit 1
fi

echo "✅ Build successful!"

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "🎉 Deployment complete!"
echo "📝 Don't forget to:"
echo "   1. Set up your environment variables in Vercel dashboard"
echo "   2. Set up your MySQL database (PlanetScale, Supabase, or similar)"
echo "   3. Run database migrations on your production database"
