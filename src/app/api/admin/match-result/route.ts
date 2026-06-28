import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { calculatePoints, isKnockoutStage } from "@/lib/scoring";

export async function PATCH(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();

    const matchId = Number(body.matchId);
    const actualTeam1Score = Number(body.actualTeam1Score);
    const actualTeam2Score = Number(body.actualTeam2Score);

    const actualWinner =
      typeof body.actualWinner === "string" && body.actualWinner.trim()
        ? body.actualWinner.trim()
        : null;

    if (!Number.isInteger(matchId)) {
      return NextResponse.json(
        { error: "Invalid match ID." },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(actualTeam1Score) ||
      !Number.isInteger(actualTeam2Score) ||
      actualTeam1Score < 0 ||
      actualTeam2Score < 0
    ) {
      return NextResponse.json(
        { error: "Final scores must be whole numbers of 0 or more." },
        { status: 400 }
      );
    }

    const match = await prisma.match.findUnique({
      where: {
        id: matchId,
      },
      include: {
        predictions: true,
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: "Match not found." },
        { status: 404 }
      );
    }

    const knockoutMatch = isKnockoutStage(match.stage);

    if (knockoutMatch) {
      if (actualWinner !== "TEAM1" && actualWinner !== "TEAM2") {
        return NextResponse.json(
          {
            error:
              "For knockout matches, please select the team that advanced/won.",
          },
          { status: 400 }
        );
      }
    }

    const updatedMatch = await prisma.match.update({
      where: {
        id: matchId,
      },
      data: {
        actualTeam1Score,
        actualTeam2Score,
        actualWinner: knockoutMatch ? actualWinner : null,
        status: "FINISHED",
      },
    });

    await Promise.all(
      match.predictions.map((prediction) => {
        const points = calculatePoints(
          prediction.predTeam1Score,
          prediction.predTeam2Score,
          actualTeam1Score,
          actualTeam2Score,
          match.stage,
          prediction.predWinner,
          knockoutMatch ? actualWinner : null
        );

        return prisma.prediction.update({
          where: {
            id: prediction.id,
          },
          data: {
            points,
          },
        });
      })
    );

    return NextResponse.json({
      message: "Final result updated successfully.",
      match: updatedMatch,
    });
  } catch (error) {
    console.error("Update match result error:", error);

    return NextResponse.json(
      { error: "Admin access required or server error." },
      { status: 500 }
    );
  }
}