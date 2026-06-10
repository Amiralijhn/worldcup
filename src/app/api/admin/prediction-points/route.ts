import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();

    const predictionId = Number(body.predictionId);
    const predTeam1Score = Number(body.predTeam1Score);
    const predTeam2Score = Number(body.predTeam2Score);
    const points = Number(body.points);

    if (!Number.isInteger(predictionId)) {
      return NextResponse.json(
        { error: "Invalid prediction ID." },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(predTeam1Score) ||
      !Number.isInteger(predTeam2Score) ||
      predTeam1Score < 0 ||
      predTeam2Score < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Predicted scores must be whole numbers greater than or equal to 0.",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(points)) {
      return NextResponse.json(
        { error: "Points must be a whole number." },
        { status: 400 }
      );
    }

    const existingPrediction = await prisma.prediction.findUnique({
      where: {
        id: predictionId,
      },
    });

    if (!existingPrediction) {
      return NextResponse.json(
        { error: "Prediction not found." },
        { status: 404 }
      );
    }

    const updatedPrediction = await prisma.prediction.update({
      where: {
        id: predictionId,
      },
      data: {
        predTeam1Score,
        predTeam2Score,
        points,
      },
    });

    return NextResponse.json({
      message: "Prediction and points updated successfully.",
      prediction: updatedPrediction,
    });
  } catch (error) {
    console.error("Admin prediction update error:", error);

    return NextResponse.json(
      {
        error: "Admin access required or server error.",
      },
      { status: 500 }
    );
  }
}