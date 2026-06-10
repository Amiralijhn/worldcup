import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  authCookieName,
  requireUser,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const authenticatedUser = await requireUser();
    const body = await request.json();

    const currentPassword = String(body.currentPassword || "");
    const newPassword = String(body.newPassword || "");

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          error: "Current password and new password are required.",
        },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          error: "New password must be at least 8 characters.",
        },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        {
          error: "New password must be different from your current password.",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: authenticatedUser.id,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User account was not found." },
        { status: 404 }
      );
    }

    const currentPasswordIsCorrect = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!currentPasswordIsCorrect) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 401 }
      );
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    const response = NextResponse.json({
      message:
        "Password changed successfully. Please log in again.",
    });

    // Log the user out after changing the password.
    response.cookies.set(authCookieName, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Change password error:", error);

    return NextResponse.json(
      {
        error: "Unable to change password.",
      },
      { status: 500 }
    );
  }
}