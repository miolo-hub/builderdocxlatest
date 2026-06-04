import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { ROLE_LABELS, normalizeRole, type UserRole } from "@/lib/rbac";

export async function GET() {
  try {
    const rows = await getPrisma().portalUser.findMany({
      orderBy: { email: "asc" },
      select: { email: true, name: true, role: true },
    });
    return NextResponse.json({
      accounts: rows.map((u) => ({
        email: u.email,
        name: u.name,
        role: ROLE_LABELS[normalizeRole(u.role) as UserRole] ?? u.role,
      })),
    });
  } catch (e) {
    console.error("demo-accounts:", e);
    return NextResponse.json({ accounts: [] });
  }
}
