import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export const authCookieName = "worldcup_token";

export type AuthUser = {
  id: number;
  username: string;
  displayName: string;
  role: "ADMIN" | "PLAYER";
};

export function createToken(user: AuthUser) {
  return jwt.sign(user, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as AuthUser;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();

  if (user.role !== "ADMIN") {
    throw new Error("Admin only");
  }

  return user;
}