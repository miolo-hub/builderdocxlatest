import type { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "./prisma";

type Tx = Prisma.TransactionClient;

/**
 * Client CRM stage → inventory unit status (project grid counts use unit.status).
 * null = update client stage only, no unit row change.
 */
export function unitStatusForClientStage(stage: string): string | null {
  switch (stage) {
    case "booked":
    case "active_buyer":
    case "completed":
      return "sold";
    case "negotiating":
      return "reserved";
    case "prospect":
    case "cancelled":
      return "available";
    case "interested":
      return null;
    default:
      return null;
  }
}

export async function resolveClientUnit(
  tx: Tx,
  client: {
    id: string;
    builderId: string;
    unit: string | null;
    tower: string | null;
    projectName: string | null;
  }
) {
  const deal = await tx.deal.findFirst({
    where: { clientId: client.id },
    include: { unit: { include: { project: true } } },
    orderBy: { bookingDate: "desc" },
  });
  if (deal?.unit) return deal.unit;

  const linked = await tx.unit.findFirst({
    where: { clientId: client.id },
    include: { project: true },
  });
  if (linked) return linked;

  if (!client.unit?.trim() || !client.projectName?.trim()) return null;

  const projects = await tx.project.findMany({
    where: { builderId: client.builderId },
    select: { id: true, name: true },
  });
  const project = projects.find(
    (p) => p.name.toLowerCase() === client.projectName!.trim().toLowerCase()
  );
  if (!project) return null;

  const unitNumber = client.unit.trim();
  const units = await tx.unit.findMany({
    where: { projectId: project.id },
    include: { project: true },
  });

  let match = units.find(
    (u) => u.unitNumber.toLowerCase() === unitNumber.toLowerCase()
  );
  if (!match && client.tower?.trim()) {
    const tower = client.tower.trim().toLowerCase();
    match = units.find(
      (u) =>
        u.unitNumber.toLowerCase() === unitNumber.toLowerCase() &&
        (u.block?.toLowerCase().includes(tower) ||
          tower.includes(u.block?.toLowerCase() ?? ""))
    );
  }
  return match ?? null;
}

/** Cancellation / full release — frees flats even when a deal exists. */
async function releaseAllClientInventory(tx: Tx, clientId: string) {
  const deals = await tx.deal.findMany({
    where: { clientId },
    select: { id: true, unitId: true },
  });

  for (const deal of deals) {
    await tx.unit.update({
      where: { id: deal.unitId },
      data: {
        status: "available",
        clientId: null,
        bookingDate: null,
      },
    });
    await tx.deal.update({
      where: { id: deal.id },
      data: { paymentStatus: "cancelled" },
    });
  }

  await tx.unit.updateMany({
    where: { clientId },
    data: {
      status: "available",
      clientId: null,
      bookingDate: null,
    },
  });
}

async function releaseClientUnitsWithoutDeal(
  tx: Tx,
  clientId: string,
  exceptUnitId?: string
) {
  const dealUnitIds = (
    await tx.deal.findMany({
      where: { clientId },
      select: { unitId: true },
    })
  ).map((d) => d.unitId);

  const units = await tx.unit.findMany({
    where: {
      clientId,
      ...(exceptUnitId ? { id: { not: exceptUnitId } } : {}),
    },
  });

  for (const unit of units) {
    if (dealUnitIds.includes(unit.id)) continue;
    await tx.unit.update({
      where: { id: unit.id },
      data: {
        status: "available",
        clientId: null,
        bookingDate: null,
      },
    });
  }
}

/**
 * Keeps project inventory unit rows aligned with client CRM stage.
 */
export async function syncClientInventoryForStage(
  clientId: string,
  builderId: string,
  newStage: string,
  options?: { unitId?: string }
) {
  return getPrisma().$transaction(async (tx) => {
    const client = await tx.client.findFirst({
      where: { id: clientId, builderId },
    });
    if (!client) return { client: null, error: "Client not found" };

    const targetStatus = unitStatusForClientStage(newStage);

    if (newStage === "cancelled") {
      await releaseAllClientInventory(tx, clientId);
      const updated = await tx.client.update({
        where: { id: clientId },
        data: { stage: "cancelled" },
      });
      return { client: updated, unitSynced: true };
    }

    if (targetStatus === "available") {
      await releaseClientUnitsWithoutDeal(tx, clientId);
      const updated = await tx.client.update({
        where: { id: clientId },
        data: { stage: newStage },
      });
      return { client: updated, unitSynced: true };
    }

    if (targetStatus === null) {
      const updated = await tx.client.update({
        where: { id: clientId },
        data: { stage: newStage },
      });
      return { client: updated, unitSynced: false };
    }

    let unit = options?.unitId
      ? await tx.unit.findFirst({
          where: { id: options.unitId, project: { builderId } },
          include: { project: true },
        })
      : null;
    if (!unit) unit = await resolveClientUnit(tx, client);
    if (!unit) {
      throw new Error(
        "No matching flat found. Set unit & project on the client profile, or use Book flat to pick a unit from inventory."
      );
    }

    if (unit.clientId && unit.clientId !== clientId) {
      throw new Error(
        `Unit ${unit.unitNumber} is already assigned to another client`
      );
    }

    const canTake =
      unit.clientId === clientId ||
      unit.status === "available" ||
      (targetStatus === "sold" &&
        (unit.status === "reserved" || unit.status === "blocked"));

    if (!canTake) {
      throw new Error(
        `Unit ${unit.unitNumber} is ${unit.status} and cannot be set to ${newStage}`
      );
    }

    await tx.unit.update({
      where: { id: unit.id },
      data: {
        status: targetStatus,
        clientId: client.id,
        bookingDate:
          targetStatus === "sold" || targetStatus === "reserved"
            ? new Date()
            : unit.bookingDate,
      },
    });

    await tx.client.update({
      where: { id: clientId },
      data: {
        stage: newStage,
        unit: unit.unitNumber,
        tower: unit.block ?? client.tower,
        projectName: unit.project.name,
      },
    });

    await releaseClientUnitsWithoutDeal(tx, clientId, unit.id);

    const updated = await tx.client.findUnique({ where: { id: clientId } });
    return { client: updated, unitSynced: true, unitId: unit.id };
  });
}
