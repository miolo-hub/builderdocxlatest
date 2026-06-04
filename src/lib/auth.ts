import { cookies } from "next/headers";
import { findPortalUserById } from "./users-db";
import { readStore } from "./store";
import type { PortalUser } from "./types";

const SESSION_COOKIE = "builderdocs_session";

export async function getSessionUser(): Promise<PortalUser | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!userId) return null;

  try {
    const user = await findPortalUserById(userId);
    if (user) return user;
  } catch {
    /* fallback */
  }

  const store = readStore();
  return store.users.find((u) => u.id === userId) ?? null;
}

export function sessionCookieOptions(userId: string) {
  return {
    name: SESSION_COOKIE,
    value: userId,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 8,
  };
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
