import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();

    const predictionId = Number(body.predictionId);
    const points = Number(body.points);

    if (!Number.isInteger(predictionId)) {
      return NextResponse.json(
        { error: "Invalid prediction ID." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(points)) {
      return NextResponse.json(
        { error: "Points must be a whole number." },
        { status: 400 }
      );
    }

    const prediction = await prisma.prediction.findUnique({
      where: {
        id: predictionId,
      },
    });

    if (!prediction) {
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
        points,
      },
    });

    return NextResponse.json({
      message: "Prediction points updated successfully.",
      prediction: updatedPrediction,
    });
  } catch (error) {
    console.error("Update prediction points error:", error);

    return NextResponse.json(
      { error: "Admin access required or server error." },
      { status: 500 }
    );
  }
}