import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  const activities = await getPrisma().activityLog.findMany({
    where: { builderId: user!.builderId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  
  return NextResponse.json({ activities });
}
