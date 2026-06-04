import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { getPrisma } from "@/lib/prisma";
import { generateId } from "@/lib/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  const units = await getPrisma().unit.findMany({
    where: { projectId: id, project: { builderId: user!.builderId } },
    include: { client: { select: { name: true } }, agent: { select: { name: true } } },
    orderBy: { unitNumber: "asc" },
  });
  return NextResponse.json({ units });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser("units.manage");
  if (error) return error;
  const { id: projectId } = await params;
  const body = await request.json();
  const unit = await getPrisma().unit.create({
    data: {
      id: generateId("unit"),
      projectId,
      unitNumber: body.unitNumber,
      type: body.type ?? "apartment",
      floor: body.floor,
      block: body.block,
      areaSqft: body.areaSqft,
      facing: body.facing,
      basePrice: parseFloat(body.basePrice),
      status: body.status ?? "available",
    },
  });
  return NextResponse.json({ unit }, { status: 201 });
}
