import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { readStore } from "@/lib/store";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);
  const store = readStore();
  const audit = store.audit
    .filter((a) => a.builderId === user.builderId)
    .slice(0, limit);
  return NextResponse.json({ audit });
}
