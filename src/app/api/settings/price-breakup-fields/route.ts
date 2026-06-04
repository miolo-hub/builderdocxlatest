import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import {
  DEFAULT_PRICE_BREAKUP_FIELDS,
  type PriceBreakupFieldDef,
} from "@/lib/price-breakup-fields";
import { getPriceBreakupFields, savePriceBreakupFields } from "@/lib/builder-settings";

export async function GET() {
  const { user, error } = await requireUser("clients.manage");
  if (error) return error;

  const fields = await getPriceBreakupFields(user!.builderId);
  return NextResponse.json({ fields, defaults: DEFAULT_PRICE_BREAKUP_FIELDS });
}

export async function PATCH(request: Request) {
  const { user, error } = await requireUser("clients.manage");
  if (error) return error;

  const body = await request.json();
  const fields = body.fields as PriceBreakupFieldDef[] | undefined;
  if (!Array.isArray(fields)) {
    return NextResponse.json({ error: "fields array required" }, { status: 400 });
  }

  const saved = await savePriceBreakupFields(user!.builderId, fields);
  return NextResponse.json({ fields: saved });
}
