import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import {
  bulkCreateUnits,
  generateTowerLayoutUnits,
  parseInventorySpreadsheet,
  type UnitSeed,
} from "@/lib/inventory-import";
import { getPrisma } from "@/lib/prisma";
import { generateId } from "@/lib/store";
import type { PortalUserPublic } from "@/lib/users-db";

function unitCountsFromUnits(units: { status: string }[]) {
  return {
    available: units.filter((u) => u.status === "available").length,
    reserved: units.filter((u) => u.status === "reserved").length,
    sold: units.filter((u) => u.status === "sold").length,
    blocked: units.filter((u) => u.status === "blocked").length,
  };
}

async function createProjectWithUnits(
  user: PortalUserPublic,
  meta: {
    name: string;
    location: string;
    type: string;
    status: string;
    constructionPct: number;
  },
  units: UnitSeed[]
) {
  if (units.length === 0) {
    throw new Error("No units to create");
  }

  const project = await getPrisma().$transaction(async (tx) => {
    const created = await tx.project.create({
      data: {
        id: generateId("proj"),
        builderId: user.builderId,
        name: meta.name,
        type: meta.type,
        location: meta.location,
        totalUnits: units.length,
        status: meta.status,
        constructionPct: meta.constructionPct,
      },
    });

    await bulkCreateUnits(tx, created.id, units);

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
      builderId: user.builderId,
      type: "project.created",
      description: `Project added: ${project.name} (${units.length} units)`,
      actor: user.name,
    },
  });

  const { units: unitRows, ...rest } = project;
  return {
    ...rest,
    unitCounts: unitCountsFromUnits(unitRows),
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

  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const name = String(form.get("name") ?? "").trim();
      if (!name) {
        return NextResponse.json({ error: "Project name is required" }, { status: 400 });
      }

      const file = form.get("file");
      if (!file || !(file instanceof File)) {
        return NextResponse.json({ error: "Excel/CSV file is required" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const units = parseInventorySpreadsheet(buffer);

      const project = await createProjectWithUnits(
        user!,
        {
          name,
          location: String(form.get("location") ?? "").trim(),
          type: String(form.get("type") ?? "residential"),
          status: String(form.get("status") ?? "active"),
          constructionPct: parseInt(String(form.get("constructionPct") ?? 0), 10) || 0,
        },
        units
      );

      return NextResponse.json({ project }, { status: 201 });
    }

    const body = await request.json();
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const towerCount = parseInt(String(body.towerCount ?? 0), 10);
    const floors = parseInt(String(body.floors ?? 0), 10);
    const flatsPerFloor = parseInt(String(body.flatsPerFloor ?? 0), 10);

    if (!towerCount || !floors || !flatsPerFloor) {
      return NextResponse.json(
        {
          error:
            "Provide tower count, number of floors, and flats per floor (or upload Excel)",
        },
        { status: 400 }
      );
    }

    const units = generateTowerLayoutUnits({
      towerCount,
      floors,
      flatsPerFloor,
      defaultBasePrice: parseFloat(String(body.defaultBasePrice ?? 0)) || 0,
    });

    const project = await createProjectWithUnits(
      user!,
      {
        name: body.name.trim(),
        location: body.location?.trim() ?? "",
        type: body.type ?? "residential",
        status: body.status ?? "active",
        constructionPct: parseInt(String(body.constructionPct ?? 0), 10) || 0,
      },
      units
    );

    return NextResponse.json({ project }, { status: 201 });
  } catch (e) {
    console.error("Create project:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create project" },
      { status: 400 }
    );
  }
}
