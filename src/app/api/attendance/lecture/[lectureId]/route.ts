import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/serverAuth";

// GET - Get attendance list for a specific lecture
export async function GET(
  request: NextRequest,
  { params }: { params: { lectureId: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is lecturer or admin
    if (user.role !== "LECTURER" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { lectureId } = params;

    // Get the lecture with attendance details
    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
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
        attendances: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                matricNumber: true,
                email: true,
              },
            },
          },
          orderBy: {
            markedAt: "desc",
          },
        },
      },
    });

    if (!lecture) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }

    // Check if user has access to this lecture
    if (user.role === "LECTURER") {
      const lecturer = await prisma.lecturer.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!lecturer || lecture.lecturerId !== lecturer.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Get all students registered for this course
    const registeredStudents = await prisma.courseRegistration.findMany({
      where: {
        courseId: lecture.courseId,
        status: "APPROVED",
      },
      select: {
        studentName: true,
        studentEmail: true,
        matricNumber: true,
      },
    });

    // Create a map of attendance by student email
    const attendanceMap = new Map();
    lecture.attendances.forEach((attendance) => {
      attendanceMap.set(attendance.student.email, attendance);
    });

    // Create comprehensive attendance list
    const attendanceList = registeredStudents.map((student) => {
      const attendance = attendanceMap.get(student.studentEmail);
      return {
        studentName: student.studentName,
        studentEmail: student.studentEmail,
        matricNumber: student.matricNumber,
        status: attendance ? attendance.status : "ABSENT",
        markedAt: attendance ? attendance.markedAt : null,
        latitude: attendance ? attendance.latitude : null,
        longitude: attendance ? attendance.longitude : null,
      };
    });

    // Calculate statistics
    const presentCount = lecture.attendances.filter(
      (a) => a.status === "PRESENT"
    ).length;
    const totalRegistered = registeredStudents.length;
    const absentCount = totalRegistered - presentCount;

    return NextResponse.json({
      lecture: {
        id: lecture.id,
        course: lecture.course,
        lecturer: lecture.lecturer,
        startTime: lecture.startTime,
        endTime: lecture.endTime,
        linkExpiry: lecture.linkExpiry,
        uniqueCode: lecture.uniqueCode,
      },
      attendance: attendanceList,
      statistics: {
        totalRegistered,
        presentCount,
        absentCount,
        attendanceRate:
          totalRegistered > 0 ? (presentCount / totalRegistered) * 100 : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


