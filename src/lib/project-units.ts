import type { Prisma } from "@/generated/prisma/client";
import { generateId } from "./store";

export type UnitStatusCounts = {
  available: number;
  reserved: number;
  sold: number;
  blocked: number;
};

const PREFIX: Record<keyof UnitStatusCounts, string> = {
  available: "AV",
  reserved: "RS",
  sold: "SL",
  blocked: "BL",
};

export function totalFromCounts(counts: UnitStatusCounts): number {
  return counts.available + counts.reserved + counts.sold + counts.blocked;
}

export async function createUnitsForProject(
  tx: Prisma.TransactionClient,
  projectId: string,
  counts: UnitStatusCounts,
  defaultBasePrice: number
) {
  const price = defaultBasePrice > 0 ? defaultBasePrice : 1;

  for (const status of Object.keys(PREFIX) as (keyof UnitStatusCounts)[]) {
    const count = counts[status];
    for (let i = 1; i <= count; i++) {
      await tx.unit.create({
        data: {
          id: generateId("unit"),
          projectId,
          unitNumber: `${PREFIX[status]}-${String(i).padStart(3, "0")}`,
          type: "apartment",
          basePrice: price,
          status,
        },
      });
    }
  }
}

export function parseUnitCounts(body: {
  available?: unknown;
  reserved?: unknown;
  sold?: unknown;
  blocked?: unknown;
  totalUnits?: unknown;
}): UnitStatusCounts {
  const counts: UnitStatusCounts = {
    available: Math.max(0, parseInt(String(body.available ?? 0), 10) || 0),
    reserved: Math.max(0, parseInt(String(body.reserved ?? 0), 10) || 0),
    sold: Math.max(0, parseInt(String(body.sold ?? 0), 10) || 0),
    blocked: Math.max(0, parseInt(String(body.blocked ?? 0), 10) || 0),
  };
  const sum = totalFromCounts(counts);
  const legacyTotal = parseInt(String(body.totalUnits ?? 0), 10) || 0;
  if (sum === 0 && legacyTotal > 0) {
    counts.available = legacyTotal;
  }
  return counts;
}
