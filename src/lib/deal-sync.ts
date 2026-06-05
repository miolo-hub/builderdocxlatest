import type { Prisma } from "@/generated/prisma/client";
import { BOOKED_CLIENT_STAGES } from "./client-workflow";
import { buildMilestoneInstallments } from "./deal-installments";
import { getPrisma } from "./prisma";
import { generateId } from "./store";
import { isValidFinalPrice, resolveFinalPriceForClient } from "./unit-final-price";

type Tx = Prisma.TransactionClient;

export async function ensureDealForBookedClient(
  tx: Tx,
  params: {
    clientId: string;
    builderId: string;
    unitId: string;
    finalPrice: number;
    agentId?: string | null;
    bookingDate?: Date;
  }
) {
  const existing = await tx.deal.findFirst({
    where: { clientId: params.clientId, builderId: params.builderId },
  });
  if (existing) return existing;

  if (!isValidFinalPrice(params.finalPrice)) return null;

  const bookingDate = params.bookingDate ?? new Date();
  const dealId = generateId("deal");

  const deal = await tx.deal.create({
    data: {
      id: dealId,
      builderId: params.builderId,
      clientId: params.clientId,
      unitId: params.unitId,
      agentId: params.agentId ?? null,
      bookingDate,
      paymentPlanType: "milestone",
      totalValue: params.finalPrice,
      discount: 0,
      finalPrice: params.finalPrice,
    },
  });

  const installments = buildMilestoneInstallments(
    params.finalPrice,
    bookingDate.toISOString().slice(0, 10)
  );
  for (let i = 0; i < installments.length; i++) {
    const inst = installments[i];
    await tx.paymentScheduleItem.create({
      data: {
        id: generateId("pay"),
        dealId,
        installmentNumber: i + 1,
        dueDate: new Date(inst.dueDate),
        amount: inst.amount,
        milestone: inst.milestone,
        status: "upcoming",
      },
    });
  }

  if (params.agentId) {
    const agent = await tx.agent.findUnique({ where: { id: params.agentId } });
    if (agent) {
      await tx.commission.create({
        data: {
          id: generateId("comm"),
          dealId,
          agentId: params.agentId,
          dealValue: params.finalPrice,
          rate: agent.commissionRate,
          amount: (params.finalPrice * agent.commissionRate) / 100,
          trigger: "on_booking",
          status: "pending",
        },
      });
    }
  }

  return deal;
}

/** Creates deals for booked clients that were linked via inventory sync without Book flat. */
export async function backfillMissingDealsForBuilder(builderId: string) {
  const prisma = getPrisma();
  const clients = await prisma.client.findMany({
    where: {
      builderId,
      stage: { in: [...BOOKED_CLIENT_STAGES] },
      deals: { none: {} },
    },
  });

  for (const client of clients) {
    try {
      await prisma.$transaction(async (tx) => {
        const unit = await tx.unit.findFirst({
          where: { clientId: client.id, project: { builderId } },
          orderBy: { updatedAt: "desc" },
        });
        if (!unit) return;

        const finalPrice = await resolveFinalPriceForClient(tx, client.id, unit.id);
        if (!isValidFinalPrice(finalPrice)) return;

        await ensureDealForBookedClient(tx, {
          clientId: client.id,
          builderId,
          unitId: unit.id,
          finalPrice,
          agentId: client.assignedAgentId,
          bookingDate: unit.bookingDate ?? undefined,
        });
      });
    } catch {
      // Skip clients that cannot be backfilled (missing unit/price).
    }
  }
}
