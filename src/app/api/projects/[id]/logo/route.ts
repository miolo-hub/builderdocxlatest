import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { resolveProjectAssetUrl, storeProjectLogo } from "@/lib/project-storage";
import { getPrisma } from "@/lib/prisma";
import { generateId } from "@/lib/store";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser("projects.manage");
  if (error) return error;
  const { id: projectId } = await params;

  const project = await getPrisma().project.findFirst({
    where: { id: projectId, builderId: user!.builderId },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Logo image is required" }, { status: 400 });
  }

  const mime = file.type || "image/png";
  const ext = file.name.toLowerCase();
  const isImage =
    ALLOWED.has(mime) ||
    ext.endsWith(".png") ||
    ext.endsWith(".jpg") ||
    ext.endsWith(".jpeg") ||
    ext.endsWith(".webp") ||
    ext.endsWith(".gif") ||
    ext.endsWith(".svg");
  if (!isImage) {
    return NextResponse.json(
      { error: "Upload a PNG, JPG, WebP, GIF, or SVG image" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = await storeProjectLogo(
    user!.builderId,
    projectId,
    file.name,
    buffer,
    mime
  );

  const updated = await getPrisma().project.update({
    where: { id: projectId },
    data: { logoPath: filePath },
    select: { id: true, name: true, logoPath: true, websiteUrl: true },
  });

  await getPrisma().activityLog.create({
    data: {
      id: generateId("act"),
      builderId: user!.builderId,
      type: "project.logo_uploaded",
      description: `Logo uploaded for ${project.name}`,
      actor: user!.name,
    },
  });

  return NextResponse.json({
    project: {
      ...updated,
      logoUrl: resolveProjectAssetUrl(updated.logoPath),
    },
  });
}
