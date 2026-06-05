import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { getPrisma } from "@/lib/prisma";
import { generateId } from "@/lib/store";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  const deals = await getPrisma().deal.findMany({
    where: { builderId: user!.builderId },
    include: {
      client: { select: { name: true, phone: true } },
      unit: { select: { unitNumber: true, project: { select: { name: true } } } },
      agent: { select: { name: true } },
    },
    orderBy: { bookingDate: "desc" },
  });
  return NextResponse.json({ deals });
}

export async function POST(request: Request) {
  const { user, error } = await requireUser("deals.manage");
  if (error) return error;
  const body = await request.json();
  const prisma = getPrisma();
  const totalValue = parseFloat(body.totalValue);
  const discount = parseFloat(body.discount ?? 0);
  const finalPrice = totalValue - discount;
  if (!body.clientId || !body.unitId || !Number.isFinite(finalPrice) || finalPrice <= 0) {
    return NextResponse.json({ error: "Invalid booking data" }, { status: 400 });
  }

  const dealId = generateId("deal");

  try {
  const deal = await prisma.$transaction(async (tx) => {
    const unit = await tx.unit.findFirst({
      where: {
        id: body.unitId,
        project: { builderId: user!.builderId },
      },
      include: { project: true },
    });
    if (!unit) {
      throw new Error("UNIT_NOT_FOUND");
    }
    if (unit.status !== "available") {
      throw new Error("UNIT_NOT_AVAILABLE");
    }

    const existingDeal = await tx.deal.findFirst({
      where: { clientId: body.clientId, builderId: user!.builderId },
    });
    if (existingDeal) {
      throw new Error("CLIENT_ALREADY_BOOKED");
    }

    const d = await tx.deal.create({
      data: {
        id: dealId,
        builderId: user!.builderId,
        clientId: body.clientId,
        unitId: body.unitId,
        agentId: body.agentId,
        bookingDate: new Date(body.bookingDate ?? Date.now()),
        paymentPlanType: body.paymentPlanType ?? "milestone",
        totalValue,
        discount,
        finalPrice,
      },
    });

    await tx.unit.update({
      where: { id: body.unitId },
      data: {
        status: "sold",
        clientId: body.clientId,
        agentId: body.agentId,
        bookingDate: new Date(),
        finalPrice,
      },
    });

    await tx.unit.updateMany({
      where: {
        clientId: body.clientId,
        id: { not: body.unitId },
      },
      data: { status: "available", clientId: null, bookingDate: null, finalPrice: null },
    });

    await tx.client.update({
      where: { id: body.clientId },
      data: {
        stage: "booked",
        unit: unit.unitNumber,
        tower: unit.block,
        projectName: unit.project.name,
        assignedAgentId: body.agentId ?? undefined,
      },
    });

    const installments = body.installments as
      | { dueDate: string; amount: number; milestone?: string }[]
      | undefined;
    if (installments?.length) {
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
    }

    if (body.agentId) {
      const agent = await tx.agent.findUnique({ where: { id: body.agentId } });
      if (agent) {
        await tx.commission.create({
          data: {
            id: generateId("comm"),
            dealId,
            agentId: body.agentId,
            dealValue: finalPrice,
            rate: agent.commissionRate,
            amount: (finalPrice * agent.commissionRate) / 100,
            trigger: "on_booking",
            status: "pending",
          },
        });
      }
    }

    return d;
  });

  return NextResponse.json({ deal }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "UNIT_NOT_FOUND") {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }
    if (msg === "UNIT_NOT_AVAILABLE") {
      return NextResponse.json(
        { error: "This unit is no longer available" },
        { status: 409 }
      );
    }
    if (msg === "CLIENT_ALREADY_BOOKED") {
      return NextResponse.json(
        { error: "This client already has an active booking" },
        { status: 409 }
      );
    }
    throw e;
  }
}
