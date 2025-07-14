import { NextResponse } from "next/server";
import { getAnnouncementsData } from "@/lib/dataService";

export async function GET() {
  try {
    const announcements = await getAnnouncementsData();
    return NextResponse.json(announcements);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}
