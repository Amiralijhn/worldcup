import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { calculatePoints } from "@/lib/scoring";

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();

    const matchId = Number(body.matchId);
    const actualTeam1Score = Number(body.actualTeam1Score);
    const actualTeam2Score = Number(body.actualTeam2Score);

    if (
      !Number.isInteger(matchId) ||
      !Number.isInteger(actualTeam1Score) ||
      !Number.isInteger(actualTeam2Score) ||
      actualTeam1Score < 0 ||
      actualTeam2Score < 0
    ) {
      return NextResponse.json(
        { error: "Invalid match result" },
        { status: 400 }
      );
    }

    const match = await prisma.match.update({
      where: { id: matchId },
      data: {
        actualTeam1Score,
        actualTeam2Score,
        status: "FINISHED",
      },
    });

    const predictions = await prisma.prediction.findMany({
      where: { matchId },
    });

    for (const prediction of predictions) {
      const points = calculatePoints(
        prediction.predTeam1Score,
        prediction.predTeam2Score,
        actualTeam1Score,
        actualTeam2Score
      );

      await prisma.prediction.update({
        where: { id: prediction.id },
        data: { points },
      });
    }

    return NextResponse.json({
      message: "Result saved and points calculated",
      match,
    });
  } catch (error) {
    console.error("Admin result error:", error);

    return NextResponse.json(
      { error: "Admin only or server error" },
      { status: 500 }
    );
  }
}