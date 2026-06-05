import type { Prisma } from "@/generated/prisma/client";
import { parseWorkflowData } from "./client-workflow";

type Tx = Prisma.TransactionClient;

/** Ignore placeholder tower-layout prices (defaults to Rs. 1). */
export const MIN_REAL_FINAL_PRICE = 10_000;

export const FINAL_PRICE_REQUIRED_MSG =
  "Cannot mark as booked or sold without a final price. Generate a cost breakup or book the flat with a deal price first.";

export function priceFromBreakup(
  pb: Record<string, string | number> | undefined
): number {
  if (!pb) return 0;
  for (const key of ["totalAmount", "totalFlatCost", "netBasicCost", "baseCost"]) {
    const v = parseFloat(String(pb[key] ?? ""));
    if (!Number.isNaN(v) && v >= MIN_REAL_FINAL_PRICE) return v;
  }
  return 0;
}

export function isValidFinalPrice(n: number | null | undefined): boolean {
  return typeof n === "number" && Number.isFinite(n) && n >= MIN_REAL_FINAL_PRICE;
}

export function clientStageRequiresFinalPrice(stage: string): boolean {
  return stage === "booked" || stage === "active_buyer" || stage === "completed";
}

export async function resolveFinalPriceForClient(
  tx: Tx,
  clientId: string,
  unitId?: string
): Promise<number> {
  const deal = await tx.deal.findFirst({
    where: unitId ? { clientId, unitId } : { clientId },
    orderBy: { bookingDate: "desc" },
    select: { finalPrice: true },
  });
  if (isValidFinalPrice(deal?.finalPrice)) return deal!.finalPrice;

  const client = await tx.client.findUnique({
    where: { id: clientId },
    select: { workflowData: true },
  });
  if (client) {
    const fromPb = priceFromBreakup(
      parseWorkflowData(client.workflowData).priceBreakup
    );
    if (isValidFinalPrice(fromPb)) return fromPb;
  }

  const unit = unitId
    ? await tx.unit.findUnique({
        where: { id: unitId },
        select: { finalPrice: true },
      })
    : await tx.unit.findFirst({
        where: { clientId },
        orderBy: { updatedAt: "desc" },
        select: { finalPrice: true },
      });
  if (isValidFinalPrice(unit?.finalPrice)) return unit!.finalPrice!;

  return 0;
}

export async function assertFinalPriceForClient(
  tx: Tx,
  clientId: string,
  unitId?: string
): Promise<number> {
  const price = await resolveFinalPriceForClient(tx, clientId, unitId);
  if (!isValidFinalPrice(price)) {
    throw new Error(FINAL_PRICE_REQUIRED_MSG);
  }
  return price;
}
