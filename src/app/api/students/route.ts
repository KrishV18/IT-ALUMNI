import { NextResponse } from "next/server";
import { fetchAllStudents } from "@/services/sheetsService";

// Revalidate every 60 seconds
export const revalidate = 60;

export async function GET() {
  try {
    const students = await fetchAllStudents();
    return NextResponse.json({
      data: students,
      count: students.length,
      lastSync: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to fetch data:", err);
    return NextResponse.json({ data: [], count: 0, error: "Failed to fetch data" }, { status: 500 });
  }
}
