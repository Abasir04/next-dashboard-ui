import { NextResponse } from "next/server";
import { getMaterialsData } from "@/lib/dataService";

export async function GET() {
  try {
    const materials = await getMaterialsData();
    return NextResponse.json(materials);
  } catch (error) {
    console.error("Error fetching materials:", error);
    return NextResponse.json(
      { error: "Failed to fetch materials" },
      { status: 500 }
    );
  }
}

