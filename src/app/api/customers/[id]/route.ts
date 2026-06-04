import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getCustomerById } from "@/lib/customers-db";
import { readStore } from "@/lib/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const customer = await getCustomerById(id, user.builderId);
    if (!customer) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const store = readStore();
    const documents = store.documents.filter((d) => d.customerId === id);
    return NextResponse.json({ customer, documents });
  } catch (e) {
    console.error("getCustomer:", e);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
