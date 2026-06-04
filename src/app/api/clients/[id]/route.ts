import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { getClientById } from "@/lib/clients-db";

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
