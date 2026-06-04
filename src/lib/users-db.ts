import { getPrisma } from "./prisma";
import type { PortalUser, UserRole } from "./types";

function mapRow(row: {
  id: string;
  builderId: string;
  email: string;
  password: string;
  name: string;
  role: string;
}): PortalUser {
  return {
    id: row.id,
    builderId: row.builderId,
    email: row.email,
    password: row.password,
    name: row.name,
    role: row.role as UserRole,
  };
}

export async function findPortalUserByEmailPassword(
  email: string,
  password: string
): Promise<PortalUser | null> {
  const normalized = email.trim().toLowerCase();
  const row = await getPrisma().portalUser.findFirst({
    where: { email: normalized, password },
  });
  return row ? mapRow(row) : null;
}

export async function findPortalUserById(id: string): Promise<PortalUser | null> {
  const row = await getPrisma().portalUser.findUnique({ where: { id } });
  return row ? mapRow(row) : null;
}
