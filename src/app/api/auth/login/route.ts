import { NextResponse } from "next/server";
import { authCookieOptions } from "@/lib/auth";
import { authenticateUser } from "@/lib/users-db";
import { getPrisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "").trim();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    const result = await authenticateUser(email, password);
    if (!result) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    try {
      await getPrisma().activityLog.create({
        data: {
          id: `act_${Date.now()}`,
          builderId: result.user.builderId,
          type: "portal.login",
          description: `${result.user.name} signed in`,
          actor: result.user.name,
        },
      });
    } catch {
      /* non-blocking */
    }

    const res = NextResponse.json({ user: result.user });
    res.cookies.set(authCookieOptions(result.token));
    return res;
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json(
      {
        error:
          "Database unavailable. Set DATABASE_URL on Vercel and run npm run db:seed-all",
      },
      { status: 503 }
    );
  }
}
