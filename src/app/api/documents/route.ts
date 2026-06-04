import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { getClientById } from "@/lib/clients-db";
import {
  buildObjectKey,
  isR2Configured,
  uploadToR2,
} from "@/lib/r2";
import { getPrisma } from "@/lib/prisma";
import { generateId } from "@/lib/store";

export async function POST(request: Request) {
  const { user, error } = await requireUser("documents.manage");
  if (error) return error;

  if (!isR2Configured()) {
    return NextResponse.json({ error: "R2 not configured" }, { status: 503 });
  }

  const form = await request.formData();
  const clientId =
    (form.get("clientId") as string) || (form.get("customerId") as string);
  const type = form.get("type") as string;
  const title = (form.get("title") as string) || type;
  const visibility = (form.get("visibility") as string) || "customer";
  const documentDate =
    (form.get("documentDate") as string) || new Date().toISOString().slice(0, 10);
  const file = form.get("file") as File | null;
  const notifyCustomer = form.get("notifyCustomer") === "true";

  if (!clientId || !type || !file) {
    return NextResponse.json(
      {
        error: !file
          ? "Please select a file to upload"
          : !clientId
            ? "Client ID is required"
            : "Document type is required",
      },
      { status: 400 }
    );
  }

  const client = await getClientById(clientId, user!.builderId);
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "application/octet-stream";
  const objectKey = buildObjectKey(user!.builderId, clientId, file.name);
  await uploadToR2(objectKey, bytes, mimeType);

  const doc = await getPrisma().document.create({
    data: {
      id: generateId("doc"),
      builderId: user!.builderId,
      clientId,
      type,
      title,
      fileName: file.name,
      filePath: objectKey,
      mimeType,
      visibility,
      documentDate: new Date(documentDate),
      uploadedBy: user!.name,
    },
  });

  if (notifyCustomer) {
    await getPrisma().activityLog.create({
      data: {
        id: generateId("act"),
        builderId: user!.builderId,
        clientId,
        type: "notification.whatsapp",
        description: `Document ready: ${title}`,
        actor: "system",
        metadata: JSON.stringify({ phone: client.phone }),
      },
    });
  }

  return NextResponse.json({ document: doc, notified: notifyCustomer });
}
