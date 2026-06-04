import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { getPriceBreakupFields } from "@/lib/builder-settings";
import { parseWorkflowData } from "@/lib/client-workflow";
import { getClientById } from "@/lib/clients-db";
import { storeDocumentBytes } from "@/lib/document-storage";
import { generatePriceBreakupPdf } from "@/lib/pdf-documents";
import { getPrisma } from "@/lib/prisma";
import { createSignedUrl } from "@/lib/signed-url";
import { generateId } from "@/lib/store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser("clients.manage");
  if (error) return error;
  const { id } = await params;
  const body = await request.json();
  const values = body.values as Record<string, string> | undefined;
  if (!values || typeof values !== "object") {
    return NextResponse.json({ error: "values required" }, { status: 400 });
  }

  const client = await getClientById(id, user!.builderId);
  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const fields = await getPriceBreakupFields(user!.builderId);
  for (const f of fields) {
    if (f.required && !String(values[f.key] ?? "").trim()) {
      return NextResponse.json(
        { error: `${f.label} is required` },
        { status: 400 }
      );
    }
  }

  const builder = await getPrisma().builder.findUnique({
    where: { id: user!.builderId },
    select: { name: true },
  });

  const pdfBytes = await generatePriceBreakupPdf(
    builder?.name ?? "Builder",
    client.name,
    fields,
    values
  );

  const fileName = `price-breakup-${client.name.replace(/\s+/g, "-")}.pdf`;
  const filePath = await storeDocumentBytes(
    user!.builderId,
    id,
    fileName,
    Buffer.from(pdfBytes),
    "application/pdf"
  );

  const doc = await getPrisma().document.create({
    data: {
      id: generateId("doc"),
      builderId: user!.builderId,
      clientId: id,
      type: "price_breakup",
      title: "Price Breakup Letter",
      fileName,
      filePath,
      mimeType: "application/pdf",
      visibility: "customer",
      documentDate: new Date(),
      uploadedBy: user!.name,
    },
  });

  const data = parseWorkflowData(client.workflowData);
  data.priceBreakup = { ...values, documentId: doc.id };

  await getPrisma().client.update({
    where: { id },
    data: {
      workflowStep: "price_breakup_done",
      workflowData: JSON.stringify(data),
      projectName: values.projectName
        ? String(values.projectName)
        : client.projectName,
      unit: values.flatNumber ? String(values.flatNumber) : client.unit,
      tower: values.tower ? String(values.tower) : client.tower,
      stage: client.stage === "prospect" ? "interested" : client.stage,
    },
  });

  await getPrisma().activityLog.create({
    data: {
      id: generateId("act"),
      builderId: user!.builderId,
      clientId: id,
      type: "document.generated",
      description: `Price breakup generated for ${client.name}`,
      actor: user!.name,
    },
  });

  return NextResponse.json({
    document: doc,
    downloadUrl: createSignedUrl(filePath, 3600),
  });
}
