import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/serverAuth";

// GET - Get detailed course information including assignments, attendance, and student registrations
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const courseId = parseInt(params.courseId);
    if (isNaN(courseId)) {
      return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
    }

    // Check if user has access to this course
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        ...(user.role === "LECTURER"
          ? {
              lecturer: {
                userId: user.id,
              },
            }
          : {}),
      },
      include: {
        lecturer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignments: {
          include: {
            _count: {
              select: {
                submissions: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        lectures: {
          include: {
            attendances: {
              include: {
                student: {
                  select: {
                    id: true,
                    name: true,
                    matricNumber: true,
                  },
                },
              },
            },
            _count: {
              select: {
                attendances: true,
              },
            },
          },
          orderBy: {
            startTime: "desc",
          },
        },
        registrations: {
          where: {
            status: "APPROVED",
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        materials: {
          include: {
            lecturer: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            assignments: true,
            lectures: true,
            materials: true,
            registrations: {
              where: {
                status: "APPROVED",
              },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found or access denied" },
        { status: 404 }
      );
    }

    // Calculate attendance statistics
    const totalLectures = course.lectures.length;
    const totalStudents = course.registrations.length;

    // Calculate attendance rate for each student
    const studentAttendanceStats = course.registrations.map((registration) => {
      const matricNumber = registration.matricNumber;
      const attendedLectures = course.lectures.filter((lecture) =>
        lecture.attendances.some(
          (attendance) => attendance.student.matricNumber === matricNumber
        )
      ).length;

      return {
        studentName: registration.studentName,
        matricNumber: registration.matricNumber,
        attendedLectures,
        totalLectures,
        attendanceRate:
          totalLectures > 0 ? (attendedLectures / totalLectures) * 100 : 0,
      };
    });

    // Calculate overall attendance statistics
    const totalAttendanceRecords = course.lectures.reduce(
      (sum, lecture) => sum + lecture.attendances.length,
      0
    );
    const totalPossibleAttendance = totalLectures * totalStudents;
    const overallAttendanceRate =
      totalPossibleAttendance > 0
        ? (totalAttendanceRecords / totalPossibleAttendance) * 100
        : 0;

    // Format assignments with submission counts
    const assignmentsWithStats = course.assignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      startDate: assignment.startDate,
      dueDate: assignment.dueDate,
      isActive: assignment.isActive,
      submissionCount: assignment._count.submissions,
      totalStudents: totalStudents,
      submissionRate:
        totalStudents > 0
          ? (assignment._count.submissions / totalStudents) * 100
          : 0,
      createdAt: assignment.createdAt,
    }));

    // Format lectures with attendance data
    const lecturesWithStats = course.lectures.map((lecture) => ({
      id: lecture.id,
      uniqueCode: lecture.uniqueCode,
      startTime: lecture.startTime,
      endTime: lecture.endTime,
      linkExpiry: lecture.linkExpiry,
      attendanceCount: lecture._count.attendances,
      totalStudents: totalStudents,
      attendanceRate:
        totalStudents > 0
          ? (lecture._count.attendances / totalStudents) * 100
          : 0,
      createdAt: lecture.createdAt,
    }));

    // Format student registrations
    const studentRegistrations = course.registrations.map((registration) => ({
      id: registration.id,
      studentName: registration.studentName,
      matricNumber: registration.matricNumber,
      email: registration.studentEmail,
      phone: registration.studentPhone,
      status: registration.status,
      registeredAt: registration.createdAt,
    }));

    // Format course materials
    const courseMaterials = course.materials.map((material) => ({
      id: material.id,
      originalFilename: material.originalFilename,
      fileType: material.fileType,
      uploadedBy: material.lecturer.name,
      uploadedAt: material.createdAt,
    }));

    const courseDetails = {
      id: course.id,
      name: course.name,
      code: course.code,
      level: course.level,
      lecturer: course.lecturer,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      statistics: {
        totalStudents: totalStudents,
        totalAssignments: course._count.assignments,
        totalLectures: course._count.lectures,
        totalMaterials: course._count.materials,
        overallAttendanceRate: Math.round(overallAttendanceRate * 100) / 100,
      },
      assignments: assignmentsWithStats,
      lectures: lecturesWithStats,
      studentRegistrations: studentRegistrations,
      studentAttendanceStats: studentAttendanceStats,
      courseMaterials: courseMaterials,
    };

    return NextResponse.json({ course: courseDetails });
  } catch (error) {
    console.error("Error fetching course details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
