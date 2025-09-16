import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/serverAuth";

// GET - Fetch individual student registration details
export async function GET(
  request: NextRequest,
  { params }: { params: { registrationId: string } }
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

    const registrationId = parseInt(params.registrationId);
    if (isNaN(registrationId)) {
      return NextResponse.json(
        { error: "Invalid registration ID" },
        { status: 400 }
      );
    }

    // Check if user has access to this registration
    let whereClause: any = { id: registrationId };

    if (user.role === "LECTURER") {
      const lecturer = await prisma.lecturer.findUnique({
        where: { userId: user.id },
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

    // Get the registration with course details
    const registration = await prisma.courseRegistration.findFirst({
      where: whereClause,
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

    if (!registration) {
      return NextResponse.json(
        { error: "Registration not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({ student: registration });
  } catch (error) {
    console.error("Error fetching student registration:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update student registration details
export async function PUT(
  request: NextRequest,
  { params }: { params: { registrationId: string } }
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

    const registrationId = parseInt(params.registrationId);
    if (isNaN(registrationId)) {
      return NextResponse.json(
        { error: "Invalid registration ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { studentName, studentEmail, studentPhone, matricNumber } = body;

    // Validate required fields
    if (!studentName || !studentEmail || !studentPhone || !matricNumber) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if user has access to this registration
    let whereClause: any = { id: registrationId };

    if (user.role === "LECTURER") {
      const lecturer = await prisma.lecturer.findUnique({
        where: { userId: user.id },
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

    // Check if registration exists and user has access
    const existingRegistration = await prisma.courseRegistration.findFirst({
      where: whereClause,
    });

    if (!existingRegistration) {
      return NextResponse.json(
        { error: "Registration not found or access denied" },
        { status: 404 }
      );
    }

    // Update the registration
    const updatedRegistration = await prisma.courseRegistration.update({
      where: { id: registrationId },
      data: {
        studentName,
        studentEmail,
        studentPhone,
        matricNumber,
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

    return NextResponse.json({ student: updatedRegistration });
  } catch (error) {
    console.error("Error updating student registration:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete student registration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { registrationId: string } }
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

    const registrationId = parseInt(params.registrationId);
    if (isNaN(registrationId)) {
      return NextResponse.json(
        { error: "Invalid registration ID" },
        { status: 400 }
      );
    }

    // Check if user has access to this registration
    let whereClause: any = { id: registrationId };

    if (user.role === "LECTURER") {
      const lecturer = await prisma.lecturer.findUnique({
        where: { userId: user.id },
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

    // Check if registration exists and user has access
    const existingRegistration = await prisma.courseRegistration.findFirst({
      where: whereClause,
    });

    if (!existingRegistration) {
      return NextResponse.json(
        { error: "Registration not found or access denied" },
        { status: 404 }
      );
    }

    // Delete the registration
    await prisma.courseRegistration.delete({
      where: { id: registrationId },
    });

    return NextResponse.json({
      message: "Student registration deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting student registration:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
