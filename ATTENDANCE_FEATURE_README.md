# Attendance Management System

A complete attendance management system for the lecturer dashboard built with Next.js, Prisma, and MySQL.

## Features

### 🎯 Core Functionality

- **Create Attendance Sessions**: Lecturers can create lecture attendance sessions with custom start/end times and link expiry
- **Unique One-Time Links**: Each lecture generates a unique, non-reusable attendance link
- **Student Check-In**: Students can mark attendance using geolocation verification
- **Real-Time Monitoring**: Live attendance tracking with statistics and export capabilities
- **QR Code Generation**: Easy sharing via QR codes for quick student access

### 🔐 Security Features

- **Authentication Required**: Students must be logged in to mark attendance
- **Course Registration Check**: Only registered students can attend
- **Geolocation Verification**: Students must be physically present (location-based)
- **Time-Based Access**: Attendance only available during lecture hours
- **One-Time Use Links**: Links expire and cannot be reused

### 📊 Analytics & Reporting

- **Live Statistics**: Real-time attendance counts and percentages
- **Detailed Reports**: Complete attendance records with timestamps
- **CSV Export**: Download attendance data for external analysis
- **Student Tracking**: Individual student attendance history

## Database Schema

### Lecture Table

```sql
- id (String, Primary Key)
- courseId (Int, Foreign Key)
- lecturerId (Int, Foreign Key)
- uniqueCode (String, Unique)
- startTime (DateTime)
- endTime (DateTime)
- linkExpiry (DateTime)
- createdAt (DateTime)
- updatedAt (DateTime)
```

### Attendance Table

```sql
- id (Int, Primary Key)
- lectureId (String, Foreign Key)
- studentId (Int, Foreign Key)
- status (Enum: PRESENT/ABSENT)
- markedAt (DateTime)
- latitude (Float, Optional)
- longitude (Float, Optional)
- createdAt (DateTime)
- updatedAt (DateTime)
```

## API Endpoints

### Lectures

- `POST /api/lectures` - Create a new lecture
- `GET /api/lectures` - Get all lectures for lecturer

### Attendance

- `POST /api/attendance/[lectureCode]` - Student marks attendance
- `GET /api/attendance/[lectureCode]` - Get lecture details for students
- `GET /api/attendance/lecture/[lectureId]` - Get attendance details for lecturer

## User Flows

### Lecturer Flow

1. Navigate to Attendance page
2. Click "Create Attendance" button
3. Fill in lecture details (course, start time, end time, expiry)
4. Generate unique attendance link and QR code
5. Share link/QR code with students
6. Monitor real-time attendance
7. View detailed attendance reports
8. Export attendance data

### Student Flow

1. Receive attendance link or scan QR code
2. Navigate to attendance page
3. Allow location access
4. Click "Mark My Attendance"
5. Receive confirmation of successful attendance

## Technical Implementation

### Frontend Components

- **CreateLectureModal**: Modal for creating new lectures
- **QRCodeModal**: Display and download QR codes
- **AttendancePage**: Main lecturer interface
- **StudentAttendancePage**: Student check-in interface
- **AttendanceDetailsPage**: Detailed attendance reports

### Backend Services

- **Geolocation Validation**: Haversine formula for distance calculation
- **Time Validation**: Server-side time checks for lecture availability
- **Unique Code Generation**: Using nanoid for secure, unique codes
- **QR Code Generation**: Client-side QR code creation

### Security Measures

- **Authentication Middleware**: All endpoints require valid user authentication
- **Role-Based Access**: Lecturers can only access their own lectures
- **Time-Based Validation**: Multiple time checks prevent unauthorized access
- **Location Verification**: Geolocation requirements for attendance marking
- **Duplicate Prevention**: Unique constraints prevent multiple attendance entries

## Installation & Setup

1. **Database Migration**

   ```bash
   npx prisma migrate dev --name add_attendance_system
   ```

2. **Install Dependencies**

   ```bash
   npm install nanoid qrcode @types/qrcode
   ```

3. **Environment Variables**
   ```env
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

## Usage Examples

### Creating a Lecture

```typescript
const lectureData = {
  courseId: 1,
  startTime: "2024-01-15T10:00:00Z",
  endTime: "2024-01-15T12:00:00Z",
  linkExpiry: "2024-01-15T12:30:00Z",
};

const response = await fetch("/api/lectures", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(lectureData),
});
```

### Marking Attendance

```typescript
const attendanceData = {
  latitude: 40.7128,
  longitude: -74.006,
};

const response = await fetch(`/api/attendance/${lectureCode}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(attendanceData),
});
```

## Future Enhancements

- **Geofencing**: Venue-specific location validation
- **Biometric Verification**: Photo capture for additional verification
- **Push Notifications**: Real-time alerts for lecturers
- **Mobile App**: Native mobile application for better UX
- **Analytics Dashboard**: Advanced reporting and insights
- **Integration**: LMS and calendar system integration

## Troubleshooting

### Common Issues

1. **Location Access Denied**: Ensure browser permissions are granted
2. **Lecture Not Found**: Check if lecture code is correct and not expired
3. **Not Registered**: Verify student is registered for the course
4. **Time Restrictions**: Ensure current time is within lecture hours

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` to see detailed error messages and validation steps.


