import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ matchId: string }> }
) {
  try {
    await requireAdmin();

    const { matchId } = await context.params;
    const id = Number(matchId);

    if (!Number.isInteger(id)) {
      return NextResponse.json(
        { error: "Invalid match ID." },
        { status: 400 }
      );
    }

    const body = await request.json();

    const matchNumber = Number(body.matchNumber);
    const team1 = String(body.team1 || "").trim();
    const team2 = String(body.team2 || "").trim();
    const stage = String(body.stage || "").trim();
    const kickoffAt = String(body.kickoffAt || "").trim();

    if (!Number.isInteger(matchNumber) || matchNumber <= 0) {
      return NextResponse.json(
        { error: "Match number must be a positive whole number." },
        { status: 400 }
      );
    }

    if (!team1 || !team2 || !stage || !kickoffAt) {
      return NextResponse.json(
        { error: "Team 1, Team 2, stage, and kickoff time are required." },
        { status: 400 }
      );
    }

    const kickoffDate = new Date(kickoffAt);

    if (Number.isNaN(kickoffDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid kickoff date/time." },
        { status: 400 }
      );
    }

    const updatedMatch = await prisma.match.update({
      where: {
        id,
      },
      data: {
        matchNumber,
        team1,
        team2,
        stage,
        kickoffAt: kickoffDate,
      },
    });

    return NextResponse.json({
      message: "Match updated successfully.",
      match: updatedMatch,
    });
  } catch (error) {
    console.error("Update match error:", error);

    return NextResponse.json(
      { error: "Admin access required or server error." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ matchId: string }> }
) {
  try {
    await requireAdmin();

    const { matchId } = await context.params;
    const id = Number(matchId);

    if (!Number.isInteger(id)) {
      return NextResponse.json(
        { error: "Invalid match ID." },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.prediction.deleteMany({
        where: {
          matchId: id,
        },
      }),

      prisma.match.delete({
        where: {
          id,
        },
      }),
    ]);

    return NextResponse.json({
      message: "Match deleted successfully.",
    });
  } catch (error) {
    console.error("Delete match error:", error);

    return NextResponse.json(
      { error: "Admin access required or server error." },
      { status: 500 }
    );
  }
}