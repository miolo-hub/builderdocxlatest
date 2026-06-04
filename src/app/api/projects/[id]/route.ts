import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { getPrisma } from "@/lib/prisma";
import { generateId } from "@/lib/store";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser("projects.delete");
  if (error) return error;

  const { id } = await params;
  const prisma = getPrisma();

  const project = await prisma.project.findFirst({
    where: { id, builderId: user!.builderId },
    include: { units: { select: { id: true } } },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const unitIds = project.units.map((u) => u.id);
  if (unitIds.length > 0) {
    const dealCount = await prisma.deal.count({
      where: { unitId: { in: unitIds } },
    });
    if (dealCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete project with active deals on its units" },
        { status: 409 }
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.constructionMilestone.deleteMany({ where: { projectId: id } });
    await tx.unit.deleteMany({ where: { projectId: id } });
    await tx.project.delete({ where: { id } });
  });

  await prisma.activityLog.create({
    data: {
      id: generateId("act"),
      builderId: user!.builderId,
      type: "project.deleted",
      description: `Project deleted: ${project.name}`,
      actor: user!.name,
    },
  });

  return NextResponse.json({ ok: true });
}
