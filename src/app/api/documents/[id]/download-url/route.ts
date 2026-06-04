import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { getPrisma } from "@/lib/prisma";
import { createSignedUrl } from "@/lib/signed-url";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;

  const doc = await getPrisma().document.findFirst({
    where: { id, builderId: user!.builderId },
  });
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    downloadUrl: createSignedUrl(doc.filePath, 3600),
    title: doc.title,
    fileName: doc.fileName,
  });
}
