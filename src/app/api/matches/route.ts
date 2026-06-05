import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const matches = await prisma.match.findMany({
      orderBy: {
        matchNumber: "asc",
      },
    });

    return NextResponse.json({
      matches,
    });
  } catch (error) {
    console.error("Matches API error:", error);

    return NextResponse.json(
      { error: "Server error while loading matches" },
      { status: 500 }
    );
  }
}