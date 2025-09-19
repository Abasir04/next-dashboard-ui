import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/serverAuth";

// GET - Fetch all students registered for courses taught by the current lecturer
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is lecturer or admin
    if (user.role !== "LECTURER" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get lecturer ID
    let lecturerId: number;
    if (user.role === "ADMIN") {
      // For admin, get all students with their course registrations
      const students = await prisma.student.findMany({
        include: {
          level: {
            select: {
              id: true,
              name: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      });

      // Get course registrations for each student
      const studentsWithCourses = await Promise.all(
        students.map(async (student) => {
          const registrations = await prisma.courseRegistration.findMany({
            where: {
              status: "APPROVED",
              OR: [
                { studentEmail: student.email },
                { matricNumber: student.matricNumber },
              ],
            },
            include: {
              course: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  lecturer: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          });

          return {
            ...student,
            courses: registrations.map((reg) => reg.course),
            registrations: registrations,
          };
        })
      );

      return NextResponse.json({ students: studentsWithCourses });
    } else {
      // For lecturer, get their lecturer record
      const lecturer = await prisma.lecturer.findUnique({
        where: { userId: user.id },
      });

      if (!lecturer) {
        return NextResponse.json(
          { error: "Lecturer not found" },
          { status: 404 }
        );
      }

      lecturerId = lecturer.id;
    }

    // Get all students and filter by course registrations
    const allStudents = await prisma.student.findMany({
      include: {
        level: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Filter students who have registrations for this lecturer's courses
    const studentsWithCourses = await Promise.all(
      allStudents.map(async (student) => {
        const registrations = await prisma.courseRegistration.findMany({
          where: {
            status: "APPROVED",
            course: {
              lecturerId: lecturerId,
            },
            OR: [
              { studentEmail: student.email },
              { matricNumber: student.matricNumber },
            ],
          },
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

        return {
          ...student,
          courses: registrations.map((reg) => reg.course),
          registrations: registrations,
        };
      })
    );

    // Filter out students with no course registrations
    const filteredStudents = studentsWithCourses.filter(
      (student) => student.courses.length > 0
    );

    return NextResponse.json({ students: filteredStudents });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
