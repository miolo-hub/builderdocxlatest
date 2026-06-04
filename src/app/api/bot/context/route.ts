import { NextResponse } from "next/server";
import { findClientByPhone } from "@/lib/clients-db";
import { getBuilderById } from "@/lib/builders-db";
import { getPrisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
  const phone = new URL(request.url).searchParams.get("phone");
  if (!phone) {
    return NextResponse.json({ error: "phone required" }, { status: 400 });
  }

  const client = await findClientByPhone(phone);
  if (!client) {
    const first = await getPrisma().builder.findFirst({
      orderBy: { name: "asc" },
      select: { name: true },
    });
    return NextResponse.json({
      builderName: first?.name ?? "Builder",
      demoOtp: null,
      client: null,
    });
  }

  const builder = await getBuilderById(client.builderId);
  return NextResponse.json({
    builderName: builder?.name ?? "Builder",
    demoOtp: builder?.whatsappDemoOtp ?? null,
    client: {
      id: client.id,
      name: client.name,
      unit: client.unit,
      projectName: client.projectName,
    },
  });
  } catch (e) {
    console.error("bot/context:", e);
    return NextResponse.json(
      { error: "Server error — run npm run db:generate and restart dev" },
      { status: 500 }
    );
  }
}
