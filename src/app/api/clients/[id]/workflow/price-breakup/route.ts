import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { parseWorkflowData } from "@/lib/client-workflow";
import { getClientById } from "@/lib/clients-db";
import { storeDocumentBytes } from "@/lib/document-storage";
import { generateTemplatePdf } from "@/lib/pdf-documents";
import { applyTemplateCalculations } from "@/lib/template-calculations";
import { getTemplate, templateFieldsFromRecord } from "@/lib/templates-db";
import { getPrisma } from "@/lib/prisma";
import { createSignedUrl } from "@/lib/signed-url";
import { generateId } from "@/lib/store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser("clients.manage");
  if (error) return error;
  const { id: clientId } = await params;
  const body = await request.json();

  const templateId = String(body.templateId ?? "");
  const rawValues = body.values as Record<string, string> | undefined;
  if (!templateId || !rawValues) {
    return NextResponse.json({ error: "templateId and values required" }, { status: 400 });
  }

  const template = await getTemplate(templateId, user!.builderId);
  if (!template || template.category !== "cost_breakup") {
    return NextResponse.json({ error: "Cost breakup template not found" }, { status: 404 });
  }

  const fields = templateFieldsFromRecord(template);
  const values = applyTemplateCalculations(fields, rawValues);

  for (const f of fields) {
    if (f.required && f.type !== "section" && f.type !== "computed") {
      if (!String(values[f.key] ?? "").trim()) {
        return NextResponse.json({ error: `${f.label} is required` }, { status: 400 });
      }
    }
  }

  const client = await getClientById(clientId, user!.builderId);
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const builder = await getPrisma().builder.findUnique({
    where: { id: user!.builderId },
    select: { name: true },
  });

  let pdfBytes: Uint8Array;
  try {
    pdfBytes = await generateTemplatePdf(
      builder?.name ?? "Builder",
      client.name,
      template.name,
      fields,
      values,
      template.id
    );
  } catch (err) {
    console.error("PDF generation failed:", err);
    return NextResponse.json(
      { error: "PDF generation failed. Check field values for unsupported characters." },
      { status: 500 }
    );
  }

  const fileName = `cost-breakup-${client.name.replace(/[^a-zA-Z0-9.-]/g, "-")}.pdf`;
  const filePath = await storeDocumentBytes(
    user!.builderId,
    clientId,
    fileName,
    Buffer.from(pdfBytes),
    "application/pdf"
  );

  const doc = await getPrisma().document.create({
    data: {
      id: generateId("doc"),
      builderId: user!.builderId,
      clientId,
      type: "price_breakup",
      title: `${template.name} — ${client.name}`,
      fileName,
      filePath,
      mimeType: "application/pdf",
      visibility: "customer",
      documentDate: new Date(),
      uploadedBy: user!.name,
    },
  });

  const data = parseWorkflowData(client.workflowData);
  data.priceBreakup = {
    ...values,
    templateId: template.id,
    templateName: template.name,
    documentId: doc.id,
  };

  await getPrisma().client.update({
    where: { id: clientId },
    data: {
      workflowStep: "price_breakup_done",
      workflowData: JSON.stringify(data),
      projectName: values.projectName ? String(values.projectName) : client.projectName,
      unit: values.unitNo ? String(values.unitNo) : client.unit,
      tower: values.tower ? String(values.tower) : client.tower,
      stage: client.stage === "prospect" ? "interested" : client.stage,
    },
  });

  await getPrisma().activityLog.create({
    data: {
      id: generateId("act"),
      builderId: user!.builderId,
      clientId,
      type: "document.generated",
      description: `${template.name} generated for ${client.name}`,
      actor: user!.name,
    },
  });

  return NextResponse.json({
    document: doc,
    downloadUrl: createSignedUrl(filePath, 3600),
  });
}
