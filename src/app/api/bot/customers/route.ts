import { NextResponse } from "next/server";
import { listCustomers } from "@/lib/customers-db";
import { readStore } from "@/lib/store";

/** Public list for WhatsApp simulator — names and phones only. */
export async function GET() {
  const store = readStore();
  const builder = store.builders[0];
  if (!builder) {
    return NextResponse.json({ customers: [] });
  }
  try {
    const customers = await listCustomers(builder.id);
    return NextResponse.json({
      customers: customers.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        unit: c.unit,
        tower: c.tower,
        label: `${c.name} (${c.unit})`,
      })),
    });
  } catch (e) {
    console.error("bot/customers:", e);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
