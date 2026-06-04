import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { getPrisma } from "@/lib/prisma";
import { generateId } from "@/lib/store";

export async function GET(request: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const status = searchParams.get("status")?.trim() ?? "";

  let projects = await getPrisma().project.findMany({
    where: { builderId: user!.builderId },
    include: { _count: { select: { units: true } } },
    orderBy: { name: "asc" },
  });

  if (status) {
    projects = projects.filter((p) => p.status === status);
  }
  if (q) {
    projects = projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q)
    );
  }

  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const { user, error } = await requireUser("projects.manage");
  if (error) return error;
  const body = await request.json();

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Project name is required" }, { status: 400 });
  }

  const project = await getPrisma().project.create({
    data: {
      id: generateId("proj"),
      builderId: user!.builderId,
      name: body.name.trim(),
      type: body.type ?? "residential",
      location: body.location?.trim() ?? "",
      totalUnits: parseInt(String(body.totalUnits ?? 0), 10) || 0,
      status: body.status ?? "active",
      constructionPct: parseInt(String(body.constructionPct ?? 0), 10) || 0,
      possessionDate: body.possessionDate
        ? new Date(body.possessionDate)
        : undefined,
    },
    include: { _count: { select: { units: true } } },
  });

  await getPrisma().activityLog.create({
    data: {
      id: generateId("act"),
      builderId: user!.builderId,
      type: "project.created",
      description: `Project added: ${project.name}`,
      actor: user!.name,
    },
  });

  return NextResponse.json({ project }, { status: 201 });
}
