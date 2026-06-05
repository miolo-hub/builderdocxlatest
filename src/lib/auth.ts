import { cookies } from "next/headers";
import { verifyToken, type JwtPayload } from "./jwt";
import { normalizeRole, type UserRole } from "./rbac";
import { getPrisma } from "./prisma";

const AUTH_COOKIE = "vikrayaos_token";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  builderId: string;
  agentId?: string | null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload?.sub) return null;

  try {
    const user = await getPrisma().portalUser.findUnique({
      where: { id: payload.sub },
    });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: normalizeRole(user.role),
      builderId: user.builderId,
      agentId: user.agentId,
    };
  } catch {
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: normalizeRole(payload.role),
      builderId: payload.builderId,
    };
  }
}

export function authCookieOptions(token: string) {
  return {
    name: AUTH_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 8,
  };
}

export function clearAuthCookie() {
  return {
    name: AUTH_COOKIE,
    value: "",
    maxAge: 0,
    path: "/",
  };
}

export const AUTH_COOKIE_NAME = AUTH_COOKIE;
export type { JwtPayload };
