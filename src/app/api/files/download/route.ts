import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getFromR2, isR2Configured, isR2ObjectKey } from "@/lib/r2";
import { verifySignedUrl } from "@/lib/signed-url";
import { getPrisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get("path");
  const expires = parseInt(searchParams.get("expires") ?? "0", 10);
  const sig = searchParams.get("sig") ?? "";

  if (!filePath || !verifySignedUrl(filePath, expires, sig)) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 403 });
  }

  const doc = await getPrisma().document.findFirst({
    where: { filePath },
  }).catch(() => null);

  if (isR2ObjectKey(filePath) && isR2Configured()) {
    const object = await getFromR2(filePath);
    if (object) {
      const name = doc?.fileName ?? path.basename(filePath);
      return new NextResponse(Buffer.from(object.body), {
        headers: {
          "Content-Type": doc?.mimeType ?? object.contentType,
          "Content-Disposition": `inline; filename="${name}"`,
        },
      });
    }
  }

  if (filePath.startsWith("/uploads/")) {
    const fullPath = path.join(process.cwd(), "public", filePath.replace(/^\//, ""));
    if (fs.existsSync(fullPath)) {
      const buffer = fs.readFileSync(fullPath);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": doc?.mimeType ?? "application/pdf",
          "Content-Disposition": `inline; filename="${path.basename(fullPath)}"`,
        },
      });
    }
  }

  return NextResponse.json({ error: "File not found" }, { status: 404 });
}
