import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/serverAuth";

// GET - Fetch individual student details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const studentId = parseInt(params.id);
    if (isNaN(studentId)) {
      return NextResponse.json(
        { error: "Invalid student ID" },
        { status: 400 }
      );
    }

    // Get the student with their course registrations
    const student = await prisma.student.findUnique({
      where: { id: studentId },
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
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get course registrations for this student
    let whereClause: any = {
      OR: [
        { studentEmail: student.email },
        { matricNumber: student.matricNumber },
      ],
      status: "APPROVED",
    };

    // If user is lecturer, only show courses they teach
    if (user.role === "LECTURER") {
      const lecturer = await prisma.lecturer.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!lecturer) {
        return NextResponse.json(
          { error: "Lecturer not found" },
          { status: 404 }
        );
      }

      whereClause.course = {
        lecturerId: lecturer.id,
      };
    }

    const registrations = await prisma.courseRegistration.findMany({
      where: whereClause,
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

    // If lecturer and no registrations found, check if student exists but has no courses with this lecturer
    if (user.role === "LECTURER" && registrations.length === 0) {
      return NextResponse.json(
        { error: "Registration not found or access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      student: {
        ...student,
        courses: registrations.map((reg) => reg.course),
        registrations: registrations,
      },
    });
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update student details
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const studentId = parseInt(params.id);
    if (isNaN(studentId)) {
      return NextResponse.json(
        { error: "Invalid student ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, email, phone, matricNumber, address } = body;

    // Validate required fields
    if (!name || !email || !phone || !matricNumber) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!existingStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Update the student
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        name,
        email,
        phone,
        matricNumber,
        address: address || "",
      },
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
    });

    return NextResponse.json({ student: updatedStudent });
  } catch (error) {
    console.error("Error updating student:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete student
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const studentId = parseInt(params.id);
    if (isNaN(studentId)) {
      return NextResponse.json(
        { error: "Invalid student ID" },
        { status: 400 }
      );
    }

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!existingStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Delete the student (this will cascade to user due to onDelete: Cascade)
    await prisma.student.delete({
      where: { id: studentId },
    });

    return NextResponse.json({
      message: "Student deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting student:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
