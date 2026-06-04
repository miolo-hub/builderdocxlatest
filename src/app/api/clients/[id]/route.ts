import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { getClientById, updateClientStage } from "@/lib/clients-db";
import { getPrisma } from "@/lib/prisma";
import { generateId } from "@/lib/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  const client = await getClientById(id, user!.builderId);
  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ client });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser("clients.update_stage");
  if (error) return error;
  const { id } = await params;
  const body = await request.json();
  const stage = String(body.stage ?? "").trim();

  if (!stage) {
    return NextResponse.json({ error: "Stage is required" }, { status: 400 });
  }

  try {
    if (
      body.unit !== undefined ||
      body.projectName !== undefined ||
      body.tower !== undefined
    ) {
      await getPrisma().client.update({
        where: { id },
        data: {
          ...(body.unit !== undefined && { unit: String(body.unit).trim() || null }),
          ...(body.projectName !== undefined && {
            projectName: String(body.projectName).trim() || null,
          }),
          ...(body.tower !== undefined && {
            tower: String(body.tower).trim() || null,
          }),
        },
      });
    }

    const client = await updateClientStage(id, user!.builderId, stage, {
      unitId: body.unitId ? String(body.unitId) : undefined,
    });
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    await getPrisma().activityLog.create({
      data: {
        id: generateId("act"),
        builderId: user!.builderId,
        clientId: id,
        type: "client.stage_changed",
        description: `${client.name} → ${stage.replace("_", " ")}`,
        actor: user!.name,
      },
    });

    return NextResponse.json({ client });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 400 }
    );
  }
}
