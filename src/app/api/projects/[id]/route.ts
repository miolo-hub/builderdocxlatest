import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { PROJECT_STATUSES } from "@/lib/constants";
import { getPrisma } from "@/lib/prisma";
import { generateId } from "@/lib/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const project = await getPrisma().project.findFirst({
    where: { id, builderId: user!.builderId },
    select: {
      id: true,
      name: true,
      location: true,
      type: true,
      status: true,
      constructionPct: true,
      totalUnits: true,
      possessionDate: true,
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ project });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser("projects.manage");
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const prisma = getPrisma();

  const existing = await prisma.project.findFirst({
    where: { id, builderId: user!.builderId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const data: { status?: string; constructionPct?: number } = {};

  if (body.status !== undefined) {
    const status = String(body.status).trim();
    if (!PROJECT_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid project status" }, { status: 400 });
    }
    data.status = status;
  }

  if (body.constructionPct !== undefined) {
    const pct = parseInt(String(body.constructionPct), 10);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      return NextResponse.json(
        { error: "Construction % must be between 0 and 100" },
        { status: 400 }
      );
    }
    data.constructionPct = pct;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const project = await prisma.project.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      status: true,
      constructionPct: true,
    },
  });

  const parts: string[] = [];
  if (data.status) parts.push(`status → ${data.status}`);
  if (data.constructionPct !== undefined) {
    parts.push(`construction ${data.constructionPct}%`);
  }

  await prisma.activityLog.create({
    data: {
      id: generateId("act"),
      builderId: user!.builderId,
      type: "project.updated",
      description: `Project updated: ${project.name} (${parts.join(", ")})`,
      actor: user!.name,
    },
  });

  return NextResponse.json({ project });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser("projects.delete");
  if (error) return error;

  const { id } = await params;
  const prisma = getPrisma();

  const project = await prisma.project.findFirst({
    where: { id, builderId: user!.builderId },
    include: { units: { select: { id: true } } },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const unitIds = project.units.map((u) => u.id);
  if (unitIds.length > 0) {
    const dealCount = await prisma.deal.count({
      where: { unitId: { in: unitIds } },
    });
    if (dealCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete project with active deals on its units" },
        { status: 409 }
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.constructionMilestone.deleteMany({ where: { projectId: id } });
    await tx.unit.deleteMany({ where: { projectId: id } });
    await tx.project.delete({ where: { id } });
  });

  await prisma.activityLog.create({
    data: {
      id: generateId("act"),
      builderId: user!.builderId,
      type: "project.deleted",
      description: `Project deleted: ${project.name}`,
      actor: user!.name,
    },
  });

  return NextResponse.json({ ok: true });
}
