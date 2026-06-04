import bcrypt from "bcryptjs";
import { getBuilderName } from "./builders-db";
import { getPrisma } from "./prisma";
import { normalizeRole, type UserRole } from "./rbac";
import { signToken } from "./jwt";

export interface PortalUserPublic {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  builderId: string;
  builderName?: string;
  agentId?: string | null;
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<{ user: PortalUserPublic; token: string } | null> {
  const normalized = email.trim().toLowerCase();
  const row = await getPrisma().portalUser.findFirst({
    where: { email: { equals: normalized, mode: "insensitive" } },
  });
  if (!row) return null;

  const ok = await bcrypt.compare(password, row.passwordHash);
  if (!ok) return null;

  const builderName = await getBuilderName(row.builderId);
  const user: PortalUserPublic = {
    id: row.id,
    email: row.email,
    name: row.name,
    role: normalizeRole(row.role),
    builderId: row.builderId,
    builderName,
    agentId: row.agentId,
  };

  const token = await signToken({
    sub: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    builderId: row.builderId,
  });

  return { user, token };
}

export async function findPortalUserById(
  id: string
): Promise<PortalUserPublic | null> {
  const row = await getPrisma().portalUser.findUnique({ where: { id } });
  if (!row) return null;
  const builderName = await getBuilderName(row.builderId);
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: normalizeRole(row.role),
    builderId: row.builderId,
    builderName,
    agentId: row.agentId,
  };
}
