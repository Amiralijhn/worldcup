import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    const userId = Number(body.userId);
    const pointsChange = Number(body.pointsChange);
    const reason = String(body.reason || "").trim();

    if (!Number.isInteger(userId) || !Number.isInteger(pointsChange) || !reason) {
      return NextResponse.json(
        { error: "userId, pointsChange, and reason are required" },
        { status: 400 }
      );
    }

    const adjustment = await prisma.scoreAdjustment.create({
      data: {
        userId,
        adminId: admin.id,
        pointsChange,
        reason,
      },
    });

    return NextResponse.json({
      message: "Score adjustment saved",
      adjustment,
    });
  } catch (error) {
    console.error("Admin adjustment error:", error);

    return NextResponse.json(
      { error: "Admin only or server error" },
      { status: 500 }
    );
  }
}