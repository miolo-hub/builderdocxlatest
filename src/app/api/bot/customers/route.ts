import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
  try {
    const clients = await getPrisma().client.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        phone: true,
        unit: true,
        projectName: true,
      },
    });
    return NextResponse.json({
      customers: clients.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        unit: c.unit,
        label: `${c.name} (${c.unit ?? c.projectName ?? "—"})`,
      })),
    });
  } catch (e) {
    console.error("bot/customers:", e);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
