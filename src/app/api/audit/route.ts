import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const limit = parseInt(new URL(request.url).searchParams.get("limit") ?? "50", 10);
  const activities = await getPrisma().activityLog.findMany({
    where: { builderId: user.builderId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return NextResponse.json({
    audit: activities.map((a) => ({
      id: a.id,
      builderId: a.builderId,
      type: a.type,
      description: a.description,
      actor: a.actor,
      createdAt: a.createdAt.toISOString(),
    })),
  });
}
