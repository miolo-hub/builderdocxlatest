import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { getPrisma } from "@/lib/prisma";
import { generateId } from "@/lib/store";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  const projects = await getPrisma().project.findMany({
    where: { builderId: user!.builderId },
    include: { _count: { select: { units: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const { user, error } = await requireUser("projects.manage");
  if (error) return error;
  const body = await request.json();
  const project = await getPrisma().project.create({
    data: {
      id: generateId("proj"),
      builderId: user!.builderId,
      name: body.name,
      type: body.type ?? "residential",
      location: body.location ?? "",
      totalUnits: body.totalUnits ?? 0,
      status: body.status ?? "active",
      constructionPct: body.constructionPct ?? 0,
    },
  });
  return NextResponse.json({ project }, { status: 201 });
}
