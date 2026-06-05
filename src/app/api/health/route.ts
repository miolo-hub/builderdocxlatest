import { NextResponse } from "next/server";
import { isDatabaseConfigured, getPrisma } from "@/lib/prisma";
import { isR2Configured } from "@/lib/r2";

export async function GET() {
  const checks: Record<string, string> = {
    database_url: isDatabaseConfigured() ? "set" : "missing",
    jwt_secret: process.env.JWT_SECRET ? "set" : "missing",
    r2: isR2Configured() ? "set" : "missing",
    interakt_api: process.env.INTERAKT_API_KEY ? "set" : "optional",
    interakt_webhook: process.env.INTERAKT_WEBHOOK_SECRET ? "set" : "optional",
    app_base_url: process.env.APP_BASE_URL ? "set" : "optional",
  };

  if (isDatabaseConfigured()) {
    try {
      const count = await getPrisma().portalUser.count();
      checks.database = `ok (${count} users)`;
    } catch (e) {
      checks.database = `error: ${e instanceof Error ? e.message : "unknown"}`;
    }
  }

  const ok =
    checks.database_url === "set" &&
    checks.database?.startsWith("ok") &&
    checks.jwt_secret === "set";

  return NextResponse.json(
    {
      ok,
      product: "Vikraya",
      message: ok
        ? "Ready"
        : "Set DATABASE_URL and JWT_SECRET on Vercel, run npm run db:seed-all, redeploy",
      checks,
    },
    { status: ok ? 200 : 503 }
  );
}
