import { NextResponse } from "next/server";
import { requireUser, filterClientsForRole } from "@/lib/api-auth";
import { listClients, createClient } from "@/lib/clients-db";

export async function GET(request: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const params = new URL(request.url).searchParams;
  const q = params.get("q") ?? "";
  const stage = params.get("stage")?.trim() ?? "";
  const project = params.get("project")?.trim() ?? "";
  const clients = filterClientsForRole(
    user!,
    await listClients(user!.builderId, q, { stage, project })
  );
  return NextResponse.json({ clients });
}

export async function POST(request: Request) {
  const { user, error } = await requireUser("clients.manage");
  if (error) return error;
  const body = await request.json();
  const payload = {
    ...body,
    projectName: body.projectName ?? body.project,
    unitId: body.unitId ?? undefined,
  };
  try {
    const client = await createClient(user!.builderId, payload);
    return NextResponse.json({ client }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 409 }
    );
  }
}
