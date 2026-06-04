import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getFromR2, isR2Configured, isR2ObjectKey } from "@/lib/r2";
import { verifySignedUrl } from "@/lib/signed-url";
import { addAudit, readStore } from "@/lib/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get("path");
  const expires = parseInt(searchParams.get("expires") ?? "0", 10);
  const sig = searchParams.get("sig") ?? "";

  if (!filePath || !verifySignedUrl(filePath, expires, sig)) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 403 });
  }

  const store = readStore();
  const doc = store.documents.find((d) => d.filePath === filePath);
  if (doc) {
    addAudit({
      builderId: doc.builderId,
      action: "document.downloaded",
      actor: "signed_url",
      actorType: "customer",
      customerId: doc.customerId,
      documentId: doc.id,
      metadata: {
        via: "signed_url",
        storage: isR2ObjectKey(filePath) ? "r2" : "local",
      },
    });
  }

  if (isR2ObjectKey(filePath) && isR2Configured()) {
    const object = await getFromR2(filePath);
    if (object) {
      const name = doc?.fileName ?? path.basename(filePath);
      const contentType = doc?.mimeType ?? object.contentType;
      return new NextResponse(Buffer.from(object.body), {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `inline; filename="${name}"`,
        },
      });
    }
  }

  if (filePath.startsWith("/uploads/")) {
    const fullPath = path.join(
      process.cwd(),
      "public",
      filePath.replace(/^\//, "")
    );
    if (fs.existsSync(fullPath)) {
      const buffer = fs.readFileSync(fullPath);
      const name = doc?.fileName ?? path.basename(fullPath);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": doc?.mimeType ?? "application/pdf",
          "Content-Disposition": `inline; filename="${name}"`,
        },
      });
    }
  }

  return NextResponse.json(
    { error: "File not found. Please contact the builder office." },
    { status: 404 }
  );
}
