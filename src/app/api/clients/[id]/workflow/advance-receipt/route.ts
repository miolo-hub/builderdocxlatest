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
  if (!template || template.category !== "payment_receipt") {
    return NextResponse.json({ error: "Payment receipt template not found" }, { status: 404 });
  }

  const fields = templateFieldsFromRecord(template);
  const values = applyTemplateCalculations(fields, rawValues);

  const amount = parseFloat(String(values.amount ?? ""));
  if (Number.isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
  }

  const client = await getClientById(clientId, user!.builderId);
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const data = parseWorkflowData(client.workflowData);
  if (!data.priceBreakup?.documentId) {
    return NextResponse.json(
      { error: "Generate price breakup letter first" },
      { status: 400 }
    );
  }

  const paidAt = values.paidAt
    ? new Date(values.paidAt).toISOString()
    : new Date().toISOString();
  const mode = values.mode ?? "Bank transfer";
  const reference = values.reference?.trim() || undefined;

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
      { ...values, paidAt: paidAt.slice(0, 10) },
      template.id
    );
  } catch (err) {
    console.error("Receipt PDF failed:", err);
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }

  const fileName = `receipt-${client.name.replace(/[^a-zA-Z0-9.-]/g, "-")}.pdf`;
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
      type: "payment_receipt",
      title: `${template.name} — ${client.name}`,
      fileName,
      filePath,
      mimeType: "application/pdf",
      visibility: "customer",
      documentDate: new Date(paidAt),
      uploadedBy: user!.name,
    },
  });

  data.advance = {
    amount,
    mode,
    reference,
    paidAt,
    documentId: doc.id,
    templateId: template.id,
    templateName: template.name,
  };

  await getPrisma().client.update({
    where: { id: clientId },
    data: {
      workflowStep: "advance_paid",
      workflowData: JSON.stringify(data),
      stage: ["prospect", "interested"].includes(client.stage)
        ? "negotiating"
        : client.stage,
    },
  });

  await getPrisma().activityLog.create({
    data: {
      id: generateId("act"),
      builderId: user!.builderId,
      clientId,
      type: "document.generated",
      description: `${template.name} (Rs. ${amount.toLocaleString("en-IN")}) for ${client.name}`,
      actor: user!.name,
    },
  });

  return NextResponse.json({
    document: doc,
    downloadUrl: createSignedUrl(filePath, 3600),
  });
}
