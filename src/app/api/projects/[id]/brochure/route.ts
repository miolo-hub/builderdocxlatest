import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { storeProjectBrochure } from "@/lib/project-storage";
import { getPrisma } from "@/lib/prisma";
import { generateId } from "@/lib/store";

const ALLOWED = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

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
    return NextResponse.json({ error: "Brochure file is required" }, { status: 400 });
  }

  const mime = file.type || "application/pdf";
  if (!ALLOWED.has(mime) && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json(
      { error: "Upload a PDF or image brochure" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = await storeProjectBrochure(
    user!.builderId,
    projectId,
    file.name,
    buffer,
    mime
  );

  const updated = await getPrisma().project.update({
    where: { id: projectId },
    data: { brochurePath: filePath },
    select: { id: true, name: true, brochurePath: true },
  });

  await getPrisma().activityLog.create({
    data: {
      id: generateId("act"),
      builderId: user!.builderId,
      type: "project.brochure_uploaded",
      description: `Brochure uploaded for ${project.name}`,
      actor: user!.name,
    },
  });

  return NextResponse.json({ project: updated });
}
