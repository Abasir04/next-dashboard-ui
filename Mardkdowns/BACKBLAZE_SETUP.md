# Backblaze B2 Setup for Private File Downloads

This document explains how to set up Backblaze B2 for private file downloads using signed URLs.

## Required Environment Variables

Add these environment variables to your `.env.local` file:

```env
# Backblaze B2 S3 Compatible API Configuration
S3_ENDPOINT=https://s3.eu-central-003.backblazeb2.com
S3_REGION=us-west-2
S3_ACCESS_KEY_ID=your_backblaze_key_id
S3_SECRET_ACCESS_KEY=your_backblaze_application_key
S3_BUCKET=your_bucket_name
```

## How to Get Backblaze B2 Credentials

1. **Log into Backblaze B2 Console**: https://secure.backblaze.com/user_signin.htm

2. **Create an Application Key**:

   - Go to "App Keys" in the left sidebar
   - Click "Add a New Application Key"
   - Give it a name (e.g., "lecturer-dashboard")
   - Select "Allow access to Bucket(s)" and choose your bucket
   - Set "Type of Access" to "Read and Write"
   - Click "Create New Key"
   - **Save the Key ID and Application Key** - you won't see them again!

3. **Get Your S3 Endpoint**:

   - Go to "Buckets" in the left sidebar
   - Click on your bucket name
   - Look for "S3 Compatible API" section
   - Copy the endpoint URL (e.g., `https://s3.eu-central-003.backblazeb2.com`)

4. **Get Your Bucket Name**:
   - The bucket name is shown in the bucket list
   - Use this as your `S3_BUCKET` value

## How It Works

### For Private Files

- When a user requests to download a file from Backblaze B2
- The system generates a **presigned URL** using AWS S3 SDK
- The presigned URL is valid for 5 minutes by default
- The browser can download directly from this URL without additional authentication

### For Public Files

- If your Backblaze B2 bucket is public, files can be downloaded directly
- No presigned URL is needed

## Security Benefits

1. **Server-side Authentication**: Your Backblaze credentials stay on the server
2. **Temporary Access**: Presigned URLs expire after 5 minutes
3. **No Credential Exposure**: Users never see your API keys
4. **Access Control**: You can control who can download files through your application logic

## File URL Format

Backblaze B2 URLs typically look like:

```
https://s3.eu-central-003.backblazeb2.com/your-bucket-name/path/to/file.pdf
```

The system automatically:

1. Detects if a URL is from Backblaze B2
2. Extracts the S3 key (file path) from the URL
3. Generates a presigned download URL
4. Returns the presigned URL to the frontend

## Testing

To test the setup:

1. Upload a file to your Backblaze B2 bucket
2. Add the file URL to your course materials
3. Try to download the file through your application
4. The download should work without 401 errors

## Troubleshooting

### 401 Unauthorized Error

- Check that your `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY` are correct
- Verify the `S3_ENDPOINT` matches your bucket's endpoint
- Ensure the `S3_BUCKET` name is correct

### 403 Forbidden Error

- Check that your application key has the correct permissions
- Verify the bucket name in the application key settings

### 404 Not Found Error

- Check that the file exists in the bucket
- Verify the file URL is correct
- Ensure the S3 key extraction is working properly

## Alternative: Public Bucket

If you prefer to keep your bucket public:

1. Set your bucket to "Public" in Backblaze B2 console
2. Files can be downloaded directly without presigned URLs
3. No additional setup required
4. **Note**: This makes all files publicly accessible via direct URL
