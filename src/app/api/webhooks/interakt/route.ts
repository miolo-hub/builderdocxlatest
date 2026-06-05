import { NextResponse } from "next/server";
import {
  parseInteraktIncoming,
  verifyInteraktWebhookSignature,
  type InteraktWebhookPayload,
} from "@/lib/interakt";

export const dynamic = "force-dynamic";

async function enqueueInbound(phone: string, text: string) {
  const secret = process.env.INTERNAL_BOT_SECRET?.trim();
  const base =
    process.env.APP_BASE_URL?.replace(/\/$/, "") ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  await fetch(`${base}/api/bot/process-inbound`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(secret ? { "x-bot-secret": secret } : {}),
    },
    body: JSON.stringify({ phone, text }),
  });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature =
    request.headers.get("Interakt-Signature") ??
    request.headers.get("interakt-signature");

  if (!verifyInteraktWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: InteraktWebhookPayload;
  try {
    body = JSON.parse(rawBody) as InteraktWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const incoming = parseInteraktIncoming(body);
  if (incoming) {
    void enqueueInbound(incoming.phone, incoming.text).catch((err) => {
      console.error("[interakt webhook] enqueue failed:", err);
    });
  }

  return NextResponse.json({ ok: true });
}
