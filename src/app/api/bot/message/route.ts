import { NextResponse } from "next/server";
import { processBotMessage } from "@/lib/bot-engine";

export async function POST(request: Request) {
  const { phone, text } = await request.json();
  if (!phone || !text) {
    return NextResponse.json({ error: "phone and text required" }, { status: 400 });
  }
  const result = await processBotMessage(phone, text);
  return NextResponse.json(result);
}
