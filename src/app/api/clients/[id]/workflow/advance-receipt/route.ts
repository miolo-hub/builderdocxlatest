import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { parseWorkflowData } from "@/lib/client-workflow";
import { getClientById } from "@/lib/clients-db";
import { storeDocumentBytes } from "@/lib/document-storage";
import { generateAdvanceReceiptPdf } from "@/lib/pdf-documents";
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

  const amount = parseFloat(String(body.amount ?? ""));
  if (Number.isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: "Valid advance amount required" }, { status: 400 });
  }

  const client = await getClientById(id, user!.builderId);
  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data = parseWorkflowData(client.workflowData);
  if (!data.priceBreakup?.documentId) {
    return NextResponse.json(
      { error: "Generate price breakup letter first" },
      { status: 400 }
    );
  }

  const paidAt = body.paidAt ? new Date(body.paidAt).toISOString() : new Date().toISOString();
  const mode = String(body.mode ?? "bank_transfer");
  const reference = body.reference ? String(body.reference) : undefined;

  const builder = await getPrisma().builder.findUnique({
    where: { id: user!.builderId },
    select: { name: true },
  });

  const pb = data.priceBreakup;
  const pdfBytes = await generateAdvanceReceiptPdf(builder?.name ?? "Builder", client.name, {
    amount,
    mode,
    reference,
    paidAt,
    projectName: String(pb.projectName ?? client.projectName ?? ""),
    flatNumber: String(pb.flatNumber ?? client.unit ?? ""),
    tower: String(pb.tower ?? client.tower ?? ""),
  });

  const fileName = `advance-receipt-${client.name.replace(/\s+/g, "-")}.pdf`;
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
      type: "payment_receipt",
      title: "Advance Payment Receipt",
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
  };

  await getPrisma().client.update({
    where: { id },
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
      clientId: id,
      type: "document.generated",
      description: `Advance receipt (₹${amount.toLocaleString("en-IN")}) for ${client.name}`,
      actor: user!.name,
    },
  });

  return NextResponse.json({
    document: doc,
    downloadUrl: createSignedUrl(filePath, 3600),
  });
}
