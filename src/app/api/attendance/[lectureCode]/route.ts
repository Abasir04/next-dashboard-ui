import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/serverAuth";

// Helper function to calculate distance between two coordinates using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// POST - Student marks attendance
export async function POST(
  request: NextRequest,
  { params }: { params: { lectureCode: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is student
    if (user.role !== "STUDENT") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { lectureCode } = params;
    const body = await request.json();
    const { latitude, longitude } = body;

    // Validate geolocation
    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: "Location data is required" },
        { status: 400 }
      );
    }

    // Get the lecture
    const lecture = await prisma.lecture.findUnique({
      where: { uniqueCode: lectureCode },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!lecture) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }

    // Check if lecture is active
    const now = new Date();
    if (now < lecture.startTime) {
      return NextResponse.json(
        { error: "Lecture has not started yet" },
        { status: 400 }
      );
    }

    if (now > lecture.linkExpiry) {
      return NextResponse.json(
        { error: "Attendance link has expired" },
        { status: 400 }
      );
    }

    // Get student
    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      select: { id: true, name: true, matricNumber: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Check if student is registered for the course
    const registration = await prisma.courseRegistration.findFirst({
      where: {
        courseId: lecture.courseId,
        studentEmail: user.email,
        status: "APPROVED",
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: "You are not registered for this course" },
        { status: 403 }
      );
    }

    // Check if student has already marked attendance
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        lectureId_studentId: {
          lectureId: lecture.id,
          studentId: student.id,
        },
      },
    });

    if (existingAttendance) {
      return NextResponse.json(
        { error: "Attendance already marked" },
        { status: 400 }
      );
    }

    // For now, we'll skip geofencing validation as we don't have venue coordinates
    // In a real implementation, you would store venue coordinates in the lecture or course
    // and validate the student is within the allowed radius (e.g., 50 meters)

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
        lectureId: lecture.id,
        studentId: student.id,
        status: "PRESENT",
        latitude,
        longitude,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            matricNumber: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Attendance marked successfully",
      attendance: {
        id: attendance.id,
        status: attendance.status,
        markedAt: attendance.markedAt,
        student: attendance.student,
      },
    });
  } catch (error) {
    console.error("Error marking attendance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Get lecture details for attendance page
export async function GET(
  request: NextRequest,
  { params }: { params: { lectureCode: string } }
) {
  try {
    const { lectureCode } = params;

    const lecture = await prisma.lecture.findUnique({
      where: { uniqueCode: lectureCode },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        lecturer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!lecture) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }

    // Check if lecture is active
    const now = new Date();
    const isActive = now >= lecture.startTime && now <= lecture.linkExpiry;
    const hasStarted = now >= lecture.startTime;
    const hasExpired = now > lecture.linkExpiry;

    return NextResponse.json({
      lecture: {
        id: lecture.id,
        course: lecture.course,
        lecturer: lecture.lecturer,
        startTime: lecture.startTime,
        endTime: lecture.endTime,
        linkExpiry: lecture.linkExpiry,
        isActive,
        hasStarted,
        hasExpired,
      },
    });
  } catch (error) {
    console.error("Error fetching lecture details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


