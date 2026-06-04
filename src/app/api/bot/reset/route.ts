import { NextResponse } from "next/server";
import { resetBotSession } from "@/lib/bot-engine";

export async function POST(request: Request) {
  const { phone } = await request.json();
  if (!phone) {
    return NextResponse.json({ error: "phone required" }, { status: 400 });
  }
  resetBotSession(phone);
  return NextResponse.json({ ok: true });
}
