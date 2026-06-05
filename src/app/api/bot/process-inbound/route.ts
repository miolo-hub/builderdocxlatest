import { NextResponse } from "next/server";
import { handleInboundBotMessage } from "@/lib/bot-inbound";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request): boolean {
  const secret = process.env.INTERNAL_BOT_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("x-bot-secret") === secret;
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const phone = String(body.phone ?? "").trim();
  const text = String(body.text ?? "").trim();
  if (!phone || !text) {
    return NextResponse.json({ error: "phone and text required" }, { status: 400 });
  }

  try {
    const result = await handleInboundBotMessage(phone, text);
    return NextResponse.json({ ok: true, session: result.session });
  } catch (err) {
    console.error("[bot process-inbound]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Processing failed" },
      { status: 500 }
    );
  }
}
