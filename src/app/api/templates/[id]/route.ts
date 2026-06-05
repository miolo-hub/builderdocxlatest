import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { parseTemplateFields } from "@/lib/document-templates";
import {
  deleteCustomTemplate,
  getTemplate,
  templateFieldsFromRecord,
  updateCustomTemplate,
} from "@/lib/templates-db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser("clients.manage");
  if (error) return error;
  const { id } = await params;

  const template = await getTemplate(id, user!.builderId);
  if (!template) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    template,
    fields: templateFieldsFromRecord(template),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser("clients.manage");
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  const template = await updateCustomTemplate(id, user!.builderId, {
    name: body.name ? String(body.name) : undefined,
    description: body.description !== undefined ? String(body.description) : undefined,
    fields: body.fields ? parseTemplateFields(JSON.stringify(body.fields)) : undefined,
  });

  if (!template) {
    return NextResponse.json(
      { error: "Template not found or system templates cannot be edited" },
      { status: 404 }
    );
  }

  return NextResponse.json({ template, fields: templateFieldsFromRecord(template) });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser("clients.manage");
  if (error) return error;
  const { id } = await params;

  const ok = await deleteCustomTemplate(id, user!.builderId);
  if (!ok) {
    return NextResponse.json(
      { error: "Template not found or cannot delete system template" },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true });
}
