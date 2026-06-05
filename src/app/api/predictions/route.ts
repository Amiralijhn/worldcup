import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    if (user.role !== "PLAYER") {
      return NextResponse.json(
        { error: "Only players can submit predictions" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const matchId = Number(body.matchId);
    const predTeam1Score = Number(body.predTeam1Score);
    const predTeam2Score = Number(body.predTeam2Score);

    if (
      !Number.isInteger(matchId) ||
      !Number.isInteger(predTeam1Score) ||
      !Number.isInteger(predTeam2Score) ||
      predTeam1Score < 0 ||
      predTeam2Score < 0
    ) {
      return NextResponse.json(
        { error: "Invalid prediction values" },
        { status: 400 }
      );
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    if (new Date() >= match.kickoffAt) {
      return NextResponse.json(
        { error: "Prediction is locked. Match already started." },
        { status: 403 }
      );
    }

    const prediction = await prisma.prediction.upsert({
      where: {
        userId_matchId: {
          userId: user.id,
          matchId,
        },
      },
      update: {
        predTeam1Score,
        predTeam2Score,
      },
      create: {
        userId: user.id,
        matchId,
        predTeam1Score,
        predTeam2Score,
      },
    });

    return NextResponse.json({
      message: "Prediction saved",
      prediction,
    });
  } catch (error) {
    console.error("Prediction API error:", error);

    return NextResponse.json(
      { error: "Server error while saving prediction" },
      { status: 500 }
    );
  }
}