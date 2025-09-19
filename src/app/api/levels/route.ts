import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch all levels
export async function GET() {
  try {
    const levels = await prisma.level.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ levels });
  } catch (error) {
    console.error("Error fetching levels:", error);
    return NextResponse.json(
      { error: "Failed to fetch levels" },
      { status: 500 }
    );
  }
}
