import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import type { TemplateCategory } from "@/lib/document-templates";
import {
  createCustomTemplate,
  listTemplates,
} from "@/lib/templates-db";

export async function GET(request: Request) {
  const { user, error } = await requireUser("clients.manage");
  if (error) return error;

  const category = new URL(request.url).searchParams.get("category") as
    | TemplateCategory
    | null;

  const templates = await listTemplates(
    user!.builderId,
    category ?? undefined
  );
  return NextResponse.json({ templates });
}

export async function POST(request: Request) {
  const { user, error } = await requireUser("clients.manage");
  if (error) return error;

  const body = await request.json();
  const category = body.category as TemplateCategory;
  const name = String(body.name ?? "").trim();

  if (!name || !category) {
    return NextResponse.json({ error: "Name and category required" }, { status: 400 });
  }
  if (category !== "cost_breakup" && category !== "payment_receipt") {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const template = await createCustomTemplate(user!.builderId, {
    category,
    name,
    description: body.description ? String(body.description) : undefined,
    cloneFromId: body.cloneFromId ? String(body.cloneFromId) : undefined,
    fields: body.fields,
  });

  return NextResponse.json({ template }, { status: 201 });
}
