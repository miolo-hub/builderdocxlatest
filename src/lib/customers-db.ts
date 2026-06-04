import { normalizePhone } from "./bot-sessions";
import { prisma } from "./prisma";
import { generateId } from "./store";
import type { Customer } from "./types";

function mapRow(row: {
  id: string;
  builderId: string;
  name: string;
  phone: string;
  email: string | null;
  unit: string;
  tower: string;
  project: string;
}): Customer {
  return {
    id: row.id,
    builderId: row.builderId,
    name: row.name,
    phone: row.phone,
    email: row.email ?? undefined,
    unit: row.unit,
    tower: row.tower,
    project: row.project,
  };
}

export async function listCustomers(
  builderId: string,
  query?: string
): Promise<Customer[]> {
  const q = query?.trim();
  const rows = await prisma.customer.findMany({
    where: { builderId },
    orderBy: { name: "asc" },
  });
  let customers = rows.map(mapRow);
  if (q) {
    const lower = q.toLowerCase();
    const digits = q.replace(/\D/g, "");
    customers = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.phone.replace(/\D/g, "").includes(digits) ||
        c.unit.toLowerCase().includes(lower) ||
        c.tower.toLowerCase().includes(lower) ||
        c.project.toLowerCase().includes(lower)
    );
  }
  return customers;
}

export async function getCustomerById(
  id: string,
  builderId?: string
): Promise<Customer | null> {
  const row = await prisma.customer.findFirst({
    where: builderId ? { id, builderId } : { id },
  });
  return row ? mapRow(row) : null;
}

export async function findCustomerByPhone(
  phone: string,
  builderId?: string
): Promise<Customer | null> {
  const normalized = normalizePhone(phone);
  const rows = await prisma.customer.findMany({
    where: builderId ? { builderId } : undefined,
  });
  const match = rows.find((c) => normalizePhone(c.phone) === normalized);
  return match ? mapRow(match) : null;
}

export interface CreateCustomerInput {
  builderId: string;
  name: string;
  phone: string;
  email?: string;
  unit: string;
  tower: string;
  project: string;
}

export async function createCustomer(
  input: CreateCustomerInput
): Promise<Customer> {
  const phone = normalizePhone(input.phone);
  const existing = await findCustomerByPhone(phone, input.builderId);
  if (existing) {
    throw new Error("A customer with this phone number already exists");
  }
  const row = await prisma.customer.create({
    data: {
      id: generateId("cust"),
      builderId: input.builderId,
      name: input.name.trim(),
      phone,
      email: input.email?.trim() || null,
      unit: input.unit.trim(),
      tower: input.tower.trim(),
      project: input.project.trim(),
    },
  });
  return mapRow(row);
}
