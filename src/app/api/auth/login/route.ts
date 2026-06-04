import { NextResponse } from "next/server";
import { sessionCookieOptions } from "@/lib/auth";
import { findPortalUserByEmailPassword } from "@/lib/users-db";
import { readStore, addAudit } from "@/lib/store";

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "").trim();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  let user = null;
  try {
    user = await findPortalUserByEmailPassword(email, password);
  } catch (e) {
    console.error("Neon auth error:", e);
  }

  if (!user) {
    const store = readStore();
    user =
      store.users.find(
        (u) =>
          u.email.trim().toLowerCase() === email && u.password === password
      ) ?? null;
  }

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const store = readStore();
  const builder = store.builders.find((b) => b.id === user!.builderId);
  addAudit({
    builderId: user.builderId,
    action: "portal.login",
    actor: user.name,
    actorType: "portal_user",
    metadata: { email: user.email, role: user.role },
  });
  const res = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      builderId: user.builderId,
      builderName: builder?.name,
    },
  });
  res.cookies.set(sessionCookieOptions(user.id));
  return res;
}
