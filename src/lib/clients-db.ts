import { CLIENT_STAGES } from "./constants";
import { normalizePhone } from "./bot-sessions";
import { getPrisma } from "./prisma";
import { generateId } from "./store";

export async function listClients(
  builderId: string,
  query?: string,
  filters?: { stage?: string; project?: string }
) {
  const rows = await getPrisma().client.findMany({
    where: { builderId },
    orderBy: { name: "asc" },
    include: {
      assignedAgent: { select: { name: true } },
      preferredUnit: { select: { id: true, unitNumber: true } },
    },
  });

  let clients = rows;

  if (filters?.stage) {
    clients = clients.filter((c) => c.stage === filters.stage);
  }
  if (filters?.project) {
    const p = filters.project.toLowerCase();
    clients = clients.filter(
      (c) => c.projectName?.toLowerCase() === p
    );
  }

  if (query?.trim()) {
    const q = query.toLowerCase();
    const digits = q.replace(/\D/g, "");
    clients = clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.replace(/\D/g, "").includes(digits) ||
        (c.email?.toLowerCase().includes(q) ?? false) ||
        (c.projectName?.toLowerCase().includes(q) ?? false) ||
        (c.unit?.toLowerCase().includes(q) ?? false)
    );
  }

  return clients.map((c) => ({
    ...c,
    linkedUnitId: c.preferredUnitId,
  }));
}

export async function getClientById(id: string, builderId?: string) {
  const client = await getPrisma().client.findFirst({
    where: builderId ? { id, builderId } : { id },
    include: {
      assignedAgent: true,
      preferredUnit: {
        select: {
          id: true,
          unitNumber: true,
          block: true,
          areaSqft: true,
          project: { select: { name: true } },
        },
      },
      deals: { include: { unit: { include: { project: true } }, schedule: true } },
      documents: { orderBy: { createdAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  if (!client) return null;
  return { ...client, linkedUnitId: client.preferredUnitId };
}

export async function findClientByPhone(phone: string, builderId?: string) {
  const normalized = normalizePhone(phone);
  const rows = builderId
    ? await getPrisma().client.findMany({ where: { builderId } })
    : await getPrisma().client.findMany({ orderBy: { name: "asc" } });
  return rows.find((c) => normalizePhone(c.phone) === normalized) ?? null;
}

async function applyUnitFromId(unitId: string, builderId: string) {
  const unit = await getPrisma().unit.findFirst({
    where: { id: unitId, project: { builderId } },
    include: { project: true },
  });
  if (!unit) throw new Error("Selected flat not found in inventory");
  return {
    unitId: unit.id,
    unit: unit.unitNumber,
    tower: unit.block,
    projectName: unit.project.name,
  };
}

export async function updateClientStage(
  clientId: string,
  builderId: string,
  stage: string,
  options?: { unitId?: string }
) {
  if (!CLIENT_STAGES.includes(stage)) {
    throw new Error("Invalid client status");
  }
  const { syncClientInventoryForStage } = await import("./client-inventory-sync");
  const result = await syncClientInventoryForStage(
    clientId,
    builderId,
    stage,
    options
  );
  if (!result.client) return null;
  return result.client;
}

export async function createClient(
  builderId: string,
  data: {
    name: string;
    phone: string;
    email?: string;
    unit?: string;
    tower?: string;
    projectName?: string;
    unitId?: string;
    stage?: string;
    source?: string;
    assignedAgentId?: string;
  }
) {
  const phone = normalizePhone(data.phone);
  const existing = await findClientByPhone(phone, builderId);
  if (existing) throw new Error("A client with this phone number already exists");

  let unitFields = {
    unit: data.unit?.trim() || null,
    tower: data.tower?.trim() || null,
    projectName: data.projectName?.trim() || null,
    preferredUnitId: null as string | null,
  };

  if (data.unitId) {
    const fromUnit = await applyUnitFromId(data.unitId, builderId);
    unitFields = {
      unit: fromUnit.unit,
      tower: fromUnit.tower,
      projectName: fromUnit.projectName,
      preferredUnitId: fromUnit.unitId,
    };
  }

  const stage = data.stage ?? "prospect";
  const client = await getPrisma().client.create({
    data: {
      id: generateId("client"),
      builderId,
      name: data.name.trim(),
      phone,
      email: data.email?.trim() || null,
      unit: unitFields.unit,
      tower: unitFields.tower,
      projectName: unitFields.projectName,
      preferredUnitId: unitFields.preferredUnitId,
      stage: ["booked", "active_buyer", "completed", "negotiating"].includes(stage)
        ? "prospect"
        : stage,
      source: data.source ?? null,
      assignedAgentId: data.assignedAgentId ?? null,
    },
  });

  if (stage !== "prospect") {
    const { syncClientInventoryForStage } = await import("./client-inventory-sync");
    await syncClientInventoryForStage(client.id, builderId, stage, {
      unitId: unitFields.preferredUnitId ?? undefined,
    });
    return (
      (await getPrisma().client.findUnique({ where: { id: client.id } })) ?? client
    );
  }

  return client;
}
