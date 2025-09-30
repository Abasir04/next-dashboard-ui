import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const { type } = params;
    let count = 0;

    switch (type) {
      case "student":
        count = await prisma.student.count();
        break;
      case "lecturer":
        count = await prisma.lecturer.count();
        break;
      case "staff":
        // For staff, we'll count users with ADMIN role
        count = await prisma.user.count({
          where: { role: "ADMIN" },
        });
        break;
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching count:", error);
    return NextResponse.json(
      { error: "Failed to fetch count" },
      { status: 500 }
    );
  }
}
