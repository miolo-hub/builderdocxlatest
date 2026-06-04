import { NextResponse } from "next/server";
import { sessionCookieOptions } from "@/lib/auth";
import { readStore, addAudit } from "@/lib/store";

export async function POST(request: Request) {
  const { email, password } = await request.json();
  const store = readStore();
  const user = store.users.find(
    (u) => u.email === email && u.password === password
  );
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const builder = store.builders.find((b) => b.id === user.builderId);
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
