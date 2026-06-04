import { NextResponse } from "next/server";
import { requireUser, filterClientsForRole } from "@/lib/api-auth";
import { listClients, createClient } from "@/lib/clients-db";

export async function GET(request: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const clients = filterClientsForRole(
    user!,
    await listClients(user!.builderId, q)
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
