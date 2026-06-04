import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { getDashboardMetrics } from "@/lib/dashboard";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  const metrics = await getDashboardMetrics(user!.builderId);
  return NextResponse.json({ metrics });
}
