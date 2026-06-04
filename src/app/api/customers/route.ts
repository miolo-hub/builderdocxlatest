import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createCustomer, listCustomers } from "@/lib/customers-db";
import { addAudit } from "@/lib/store";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  try {
    const customers = await listCustomers(user.builderId, q);
    return NextResponse.json({ customers });
  } catch (e) {
    console.error("listCustomers:", e);
    return NextResponse.json(
      { error: "Database unavailable. Check DATABASE_URL and run npm run db:push" },
      { status: 503 }
    );
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, phone, email, unit, tower, project } = body;

  if (!name?.trim() || !phone?.trim() || !unit?.trim() || !tower?.trim() || !project?.trim()) {
    return NextResponse.json(
      { error: "Name, phone, unit, tower, and project are required" },
      { status: 400 }
    );
  }

  try {
    const customer = await createCustomer({
      builderId: user.builderId,
      name,
      phone,
      email,
      unit,
      tower,
      project,
    });

    addAudit({
      builderId: user.builderId,
      action: "customer.created",
      actor: user.name,
      actorType: "portal_user",
      customerId: customer.id,
      metadata: {
        name: customer.name,
        phone: customer.phone,
        unit: customer.unit,
      },
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create customer";
    const status = message.includes("already exists") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
