# Course Materials Management System

This document outlines the new Course Materials management system that has been added to the lecturer dashboard.

## Features

### 🎯 Core Functionality

- **Course-specific Materials**: Each course has its own dedicated materials page
- **File Upload**: Support for documents (PDF, DOCX, PPT, etc.) and videos (MP4, etc.)
- **Cloud Storage**: All files are stored on Cloudinary for scalability
- **Database Integration**: File metadata stored in MySQL database
- **Access Control**: Only lecturers and admins can upload/manage materials

### 🔧 Technical Implementation

#### Database Schema

- New `course_materials` table with the following fields:
  - `id` (auto increment)
  - `course_id` (foreign key to courses table)
  - `file_url` (Cloudinary link)
  - `file_type` (document, video)
  - `original_filename`
  - `uploaded_by` (lecturer ID)
  - `created_at` timestamp

#### API Endpoints

- `GET /api/courses/[courseId]/materials` - Fetch all materials for a course
- `POST /api/courses/[courseId]/materials` - Upload new material
- `DELETE /api/courses/[courseId]/materials/[materialId]` - Delete a material

#### File Storage

- **Cloudinary Integration**: All files uploaded to Cloudinary
- **Automatic File Type Detection**: Documents vs Videos
- **File Size Validation**: Maximum 100MB per file
- **Secure URLs**: All files served via HTTPS

## Setup Instructions

### 1. Environment Variables

Add the following to your `.env` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
```

### 2. Database Migration

The database migration has been created and applied:

```bash
npx prisma migrate dev --name add_course_materials
```

### 3. Dependencies

Cloudinary package has been installed:

```bash
npm install cloudinary
```

## Usage Guide

### For Lecturers

#### Accessing Course Materials

1. Navigate to the **Courses** page (`/list/courses`)
2. Click the **📄** (file) icon in the Actions column for any course
3. You'll be taken to the Course Materials page for that specific course

#### Uploading Materials

1. On the Course Materials page, use the upload form at the top
2. Select a file (documents or videos up to 100MB)
3. Click **Upload** to save the file
4. The file will be automatically categorized as document or video

#### Managing Materials

- **Download**: Click the download icon to open/download the file
- **Delete**: Click the trash icon to remove a material (requires confirmation)
- **View Details**: See upload date, file type, and uploader information

### For Admins

Admins have the same access as lecturers and can manage materials for all courses.

## File Organization

### Supported File Types

- **Documents**: PDF, DOC, DOCX, PPT, PPTX, TXT
- **Videos**: MP4, AVI, MOV, WMV, FLV, WEBM, MKV

### File Size Limits

- Maximum file size: 100MB
- No limit on number of files per course

### Storage Structure

Files are organized in Cloudinary with the following structure:

```
course-materials/
  └── [courseId]/
      └── [timestamp]-[filename]
```

## Security Features

### Access Control

- Only authenticated users can access materials
- Lecturers can only access materials for their own courses
- Admins can access materials for all courses

### File Validation

- File type validation on both client and server
- File size validation (100MB limit)
- Secure file uploads to Cloudinary

### Data Integrity

- Foreign key constraints ensure data consistency
- Cascade deletion when courses are removed
- Proper error handling for failed uploads

## Navigation

### From Course List to Materials

- Click the **📄** icon in the course table actions
- URL: `/courses/[courseId]/materials`

### Back to Course List

- Click the **←** (back arrow) button on the materials page
- Returns to `/list/courses`

## Error Handling

### Common Issues

1. **File too large**: Maximum 100MB limit
2. **Unsupported format**: Only specified file types allowed
3. **Upload failure**: Network or Cloudinary issues
4. **Access denied**: Insufficient permissions

### User Feedback

- Success/error messages via toast notifications
- Loading states during uploads and deletions
- Confirmation dialogs for destructive actions

## Future Enhancements

### Potential Improvements

- File preview functionality
- Bulk upload/download
- File versioning
- Material categorization/tagging
- Student access controls
- File sharing permissions
- Upload progress indicators
- File search and filtering

## Troubleshooting

### Common Setup Issues

1. **Cloudinary not configured**: Ensure environment variables are set
2. **Database errors**: Run migrations and check database connection
3. **Upload failures**: Verify Cloudinary credentials and network connectivity

### Support

For technical issues, check:

- Browser console for client-side errors
- Server logs for API errors
- Cloudinary dashboard for upload issues
- Database logs for data-related problems
