import { NextResponse } from "next/server";
import { getSessionUser } from "./auth";
import { can, type UserRole } from "./rbac";

type Permission = Parameters<typeof can>[1];

export async function requireUser(permission?: Permission) {
  const user = await getSessionUser();
  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (permission && !can(user.role, permission)) {
    return {
      user: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { user, error: null };
}

export function filterClientsForRole<T extends { assignedAgentId?: string | null }>(
  user: { role: UserRole; agentId?: string | null },
  items: T[]
): T[] {
  if (can(user.role, "clients.view_all")) return items;
  if (user.agentId) {
    return items.filter((c) => c.assignedAgentId === user.agentId);
  }
  return items;
}
