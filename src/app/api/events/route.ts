import { NextResponse } from "next/server";
import { getEventsData } from "@/lib/dataService";

export async function GET() {
  try {
    const events = await getEventsData();
    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
