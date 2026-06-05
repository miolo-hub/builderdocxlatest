import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { getDashboardMetrics } from "@/lib/dashboard";

export async function GET(request: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  const projectId = new URL(request.url).searchParams.get("project")?.trim() || undefined;
  const metrics = await getDashboardMetrics(user!.builderId, projectId);
  return NextResponse.json({ metrics });
}
