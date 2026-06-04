import { NextResponse } from "next/server";
import { isDatabaseConfigured, getPrisma } from "@/lib/prisma";
import { isR2Configured } from "@/lib/r2";

export async function GET() {
  const checks: Record<string, string> = {
    database_url: isDatabaseConfigured() ? "set" : "missing",
    r2: isR2Configured() ? "set" : "missing",
  };

  if (isDatabaseConfigured()) {
    try {
      await getPrisma().portalUser.count();
      checks.database = "ok";
    } catch (e) {
      checks.database = `error: ${e instanceof Error ? e.message : "unknown"}`;
    }
  } else {
    checks.database = "skipped";
  }

  const ok =
    checks.database_url === "set" &&
    checks.database === "ok" &&
    checks.r2 === "set";

  return NextResponse.json(
    {
      ok,
      message: ok
        ? "Ready for Vercel"
        : "Add missing env vars in Vercel → Settings → Environment Variables, then redeploy",
      checks,
    },
    { status: ok ? 200 : 503 }
  );
}
