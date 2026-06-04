import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { getPrisma } from "@/lib/prisma";
import { generateId } from "@/lib/store";

export async function POST(request: Request) {
  const { user, error } = await requireUser("payments.record");
  if (error) return error;
  const body = await request.json();
  const prisma = getPrisma();

  const txn = await prisma.$transaction(async (tx) => {
    const t = await tx.paymentTransaction.create({
      data: {
        id: generateId("txn"),
        dealId: body.dealId,
        scheduleItemId: body.scheduleItemId,
        amount: parseFloat(body.amount),
        mode: body.mode ?? "bank_transfer",
        reference: body.reference,
        paidAt: new Date(body.paidAt ?? Date.now()),
        recordedBy: user!.name,
      },
    });

    if (body.scheduleItemId) {
      await tx.paymentScheduleItem.update({
        where: { id: body.scheduleItemId },
        data: { status: "paid" },
      });
    }

    const deal = await tx.deal.findUnique({
      where: { id: body.dealId },
      include: { schedule: true, transactions: true },
    });
    if (deal) {
      const paid = deal.transactions.reduce((s, x) => s + x.amount, 0) + t.amount;
      const status =
        paid >= deal.finalPrice
          ? "paid_in_full"
          : deal.schedule.some(
                (s) => s.status === "overdue" || (s.status !== "paid" && s.dueDate < new Date())
              )
            ? "overdue"
            : "on_track";
      await tx.deal.update({
        where: { id: body.dealId },
        data: { paymentStatus: status },
      });
    }

    return t;
  });

  return NextResponse.json({ transaction: txn }, { status: 201 });
}
