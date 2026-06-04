import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  buildObjectKey,
  isR2Configured,
  uploadToR2,
} from "@/lib/r2";
import { getCustomerById } from "@/lib/customers-db";
import { readStore, addDocument, addAudit, generateId } from "@/lib/store";
import type { DocumentType, DocumentVisibility } from "@/lib/types";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isR2Configured()) {
    return NextResponse.json(
      {
        error:
          "R2 storage is not configured. Set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME in .env.local",
      },
      { status: 503 }
    );
  }

  const form = await request.formData();
  const customerId = form.get("customerId") as string;
  const type = form.get("type") as DocumentType;
  const title = (form.get("title") as string) || "";
  const visibility =
    (form.get("visibility") as DocumentVisibility) || "customer";
  const documentDate =
    (form.get("documentDate") as string) ||
    new Date().toISOString().slice(0, 10);
  const file = form.get("file") as File | null;
  const notifyCustomer = form.get("notifyCustomer") === "true";

  if (!customerId || !type || !file) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  let customer;
  try {
    customer = await getCustomerById(customerId, user.builderId);
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "application/octet-stream";
  const objectKey = buildObjectKey(user.builderId, customerId, file.name);

  try {
    await uploadToR2(objectKey, bytes, mimeType);
  } catch (e) {
    console.error("R2 upload failed:", e);
    return NextResponse.json(
      {
        error:
          "Failed to upload to R2. Ensure the bucket exists and credentials are correct.",
      },
      { status: 502 }
    );
  }

  const doc = {
    id: generateId("doc"),
    customerId,
    builderId: user.builderId,
    type,
    title: title || type,
    fileName: file.name,
    filePath: objectKey,
    mimeType,
    visibility,
    documentDate,
    uploadedBy: user.name,
    uploadedAt: new Date().toISOString(),
  };
  addDocument(doc);
  addAudit({
    builderId: user.builderId,
    action: "document.uploaded",
    actor: user.name,
    actorType: "portal_user",
    customerId,
    documentId: doc.id,
    metadata: {
      type,
      visibility,
      storage: "r2",
      objectKey,
      notifyCustomer: String(notifyCustomer),
    },
  });

  if (notifyCustomer && visibility === "customer") {
    addAudit({
      builderId: user.builderId,
      action: "notification.whatsapp_sent",
      actor: "system",
      actorType: "system",
      customerId,
      documentId: doc.id,
      metadata: {
        phone: customer.phone,
        message: `New document available: ${title || type}`,
      },
    });
  }

  return NextResponse.json({ document: doc, notified: notifyCustomer });
}
