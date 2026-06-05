import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { backfillMissingDealsForBuilder } from "@/lib/deal-sync";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
  const { user, error } = await requireUser("payments.view");
  if (error) return error;
  await backfillMissingDealsForBuilder(user!.builderId);
  const now = new Date();
  const items = await getPrisma().paymentScheduleItem.findMany({
    where: {
      status: { not: "paid" },
      dueDate: { lt: now },
      deal: { builderId: user!.builderId },
    },
    include: {
      deal: {
        include: {
          client: { select: { name: true, phone: true } },
          unit: { select: { unitNumber: true } },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });
  return NextResponse.json({ overdue: items });
}
