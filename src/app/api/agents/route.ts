import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { getPrisma } from "@/lib/prisma";
import { generateId } from "@/lib/store";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  const agents = await getPrisma().agent.findMany({
    where: { builderId: user!.builderId },
    include: {
      _count: { select: { deals: true, commissions: true } },
    },
  });
  return NextResponse.json({ agents });
}

export async function POST(request: Request) {
  const { user, error } = await requireUser("agents.manage");
  if (error) return error;
  const body = await request.json();
  const agent = await getPrisma().agent.create({
    data: {
      id: generateId("agent"),
      builderId: user!.builderId,
      name: body.name,
      phone: body.phone,
      whatsapp: body.whatsapp ?? body.phone,
      email: body.email,
      commissionRate: parseFloat(body.commissionRate ?? 2),
    },
  });
  return NextResponse.json({ agent }, { status: 201 });
}
