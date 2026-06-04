import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { getPrisma } from "@/lib/prisma";
import {
  createUnitsForProject,
  parseUnitCounts,
  totalFromCounts,
} from "@/lib/project-units";
import { generateId } from "@/lib/store";

function unitCountsFromUnits(units: { status: string }[]) {
  return {
    available: units.filter((u) => u.status === "available").length,
    reserved: units.filter((u) => u.status === "reserved").length,
    sold: units.filter((u) => u.status === "sold").length,
    blocked: units.filter((u) => u.status === "blocked").length,
  };
}

export async function GET(request: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const status = searchParams.get("status")?.trim() ?? "";

  let projects = await getPrisma().project.findMany({
    where: { builderId: user!.builderId },
    include: {
      _count: { select: { units: true } },
      units: { select: { status: true } },
    },
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

  const payload = projects.map(({ units, ...p }) => ({
    ...p,
    unitCounts: unitCountsFromUnits(units),
  }));

  return NextResponse.json({ projects: payload });
}

export async function POST(request: Request) {
  const { user, error } = await requireUser("projects.manage");
  if (error) return error;
  const body = await request.json();

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Project name is required" }, { status: 400 });
  }

  const counts = parseUnitCounts(body);
  const totalUnits = totalFromCounts(counts);
  if (totalUnits === 0) {
    return NextResponse.json(
      { error: "Add at least one unit (available, reserved, sold, or blocked)" },
      { status: 400 }
    );
  }

  const defaultBasePrice = parseFloat(String(body.defaultBasePrice ?? 0)) || 0;

  const project = await getPrisma().$transaction(async (tx) => {
    const created = await tx.project.create({
      data: {
        id: generateId("proj"),
        builderId: user!.builderId,
        name: body.name.trim(),
        type: body.type ?? "residential",
        location: body.location?.trim() ?? "",
        totalUnits,
        status: body.status ?? "active",
        constructionPct: parseInt(String(body.constructionPct ?? 0), 10) || 0,
        possessionDate: body.possessionDate
          ? new Date(body.possessionDate)
          : undefined,
      },
    });

    await createUnitsForProject(tx, created.id, counts, defaultBasePrice);

    return tx.project.findUniqueOrThrow({
      where: { id: created.id },
      include: {
        _count: { select: { units: true } },
        units: { select: { status: true } },
      },
    });
  });

  await getPrisma().activityLog.create({
    data: {
      id: generateId("act"),
      builderId: user!.builderId,
      type: "project.created",
      description: `Project added: ${project.name} (${totalUnits} units)`,
      actor: user!.name,
    },
  });

  const { units, ...rest } = project;
  return NextResponse.json(
    {
      project: {
        ...rest,
        unitCounts: unitCountsFromUnits(units),
      },
    },
    { status: 201 }
  );
}
