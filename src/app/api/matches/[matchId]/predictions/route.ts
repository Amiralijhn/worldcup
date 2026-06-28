import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  context: { params: Promise<{ matchId: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const { matchId } = await context.params;
    const id = Number(matchId);

    if (!Number.isInteger(id)) {
      return NextResponse.json(
        { error: "Invalid match ID." },
        { status: 400 }
      );
    }

    const match = await prisma.match.findUnique({
      where: {
        id,
      },
      include: {
        predictions: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                username: true,
              },
            },
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: "Match not found." },
        { status: 404 }
      );
    }

    const hasFinalResult =
      match.actualTeam1Score !== null &&
      match.actualTeam2Score !== null;

    if (!hasFinalResult) {
      return NextResponse.json(
        {
          error:
            "Predictions are only visible after final result is added.",
        },
        { status: 403 }
      );
    }

    const predictions = match.predictions
      .map((prediction) => ({
        id: prediction.id,
        playerName: prediction.user.displayName,
        predTeam1Score: prediction.predTeam1Score,
        predTeam2Score: prediction.predTeam2Score,
        predWinner: prediction.predWinner,
        points: prediction.points ?? 0,
      }))
      .sort(
        (a, b) =>
          b.points - a.points ||
          a.playerName.localeCompare(b.playerName)
      );

    return NextResponse.json({
      match: {
        id: match.id,
        matchNumber: match.matchNumber,
        team1: match.team1,
        team2: match.team2,
        stage: match.stage,
        actualTeam1Score: match.actualTeam1Score,
        actualTeam2Score: match.actualTeam2Score,
        actualWinner: match.actualWinner,
      },
      predictions,
    });
  } catch (error) {
    console.error("Read match predictions error:", error);

    return NextResponse.json(
      { error: "Could not load predictions." },
      { status: 500 }
    );
  }
}