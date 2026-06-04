import { CLIENT_STAGES } from "./constants";
import { normalizePhone } from "./bot-sessions";
import { getPrisma } from "./prisma";
import { generateId } from "./store";

export async function listClients(builderId: string, query?: string) {
  const rows = await getPrisma().client.findMany({
    where: { builderId },
    orderBy: { name: "asc" },
    include: { assignedAgent: { select: { name: true } } },
  });
  let clients = rows;
  if (query?.trim()) {
    const q = query.toLowerCase();
    const digits = q.replace(/\D/g, "");
    clients = rows.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.replace(/\D/g, "").includes(digits) ||
        (c.email?.toLowerCase().includes(q) ?? false) ||
        (c.projectName?.toLowerCase().includes(q) ?? false)
    );
  }
  return clients;
}

export async function getClientById(id: string, builderId?: string) {
  return getPrisma().client.findFirst({
    where: builderId ? { id, builderId } : { id },
    include: {
      assignedAgent: true,
      deals: { include: { unit: { include: { project: true } }, schedule: true } },
      documents: { orderBy: { createdAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
}

export async function findClientByPhone(phone: string, builderId?: string) {
  const normalized = normalizePhone(phone);
  const rows = builderId
    ? await getPrisma().client.findMany({ where: { builderId } })
    : await getPrisma().client.findMany({ orderBy: { name: "asc" } });
  return rows.find((c) => normalizePhone(c.phone) === normalized) ?? null;
}

export async function updateClientStage(
  clientId: string,
  builderId: string,
  stage: string
) {
  if (!CLIENT_STAGES.includes(stage)) {
    throw new Error("Invalid client stage");
  }
  const existing = await getPrisma().client.findFirst({
    where: { id: clientId, builderId },
  });
  if (!existing) return null;

  return getPrisma().client.update({
    where: { id: clientId },
    data: { stage },
  });
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
    stage?: string;
    source?: string;
    assignedAgentId?: string;
  }
) {
  const phone = normalizePhone(data.phone);
  const existing = await findClientByPhone(phone, builderId);
  if (existing) throw new Error("A client with this phone number already exists");

  return getPrisma().client.create({
    data: {
      id: generateId("client"),
      builderId,
      name: data.name.trim(),
      phone,
      email: data.email?.trim() || null,
      unit: data.unit?.trim() || null,
      tower: data.tower?.trim() || null,
      projectName: data.projectName?.trim() || null,
      stage: data.stage ?? "prospect",
      source: data.source ?? null,
      assignedAgentId: data.assignedAgentId ?? null,
    },
  });
}
