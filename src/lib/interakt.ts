import crypto from "crypto";
import { normalizePhone } from "./bot-sessions";

const API_BASE = (process.env.INTERAKT_API_BASE ?? "https://api.interakt.ai").replace(
  /\/$/,
  ""
);
const MESSAGE_URL = `${API_BASE}/v1/public/message/`;

export type InteraktWebhookPayload = {
  version?: string;
  timestamp?: string;
  type?: string;
  data?: {
    customer?: {
      channel_phone_number?: string;
      traits?: Record<string, unknown>;
    };
    message?: {
      id?: string;
      message?: string;
      message_content_type?: string;
      media_url?: string | null;
    };
  };
};

export function isInteraktConfigured(): boolean {
  return !!process.env.INTERAKT_API_KEY?.trim();
}

export function interaktAuthHeader(): string {
  const key = process.env.INTERAKT_API_KEY?.trim();
  if (!key) throw new Error("INTERAKT_API_KEY is not set");
  return `Basic ${key}`;
}

/** channel_phone_number from Interakt is digits only, e.g. 917003705584 */
export function phoneFromInteraktCustomer(channelPhone?: string): string | null {
  if (!channelPhone?.trim()) return null;
  const digits = channelPhone.replace(/\D/g, "");
  if (!digits) return null;
  return normalizePhone(digits);
}

export function splitPhoneForInterakt(phone: string): {
  countryCode: string;
  phoneNumber: string;
} {
  const normalized = normalizePhone(phone);
  const digits = normalized.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length >= 12) {
    return { countryCode: "+91", phoneNumber: digits.slice(2) };
  }
  if (digits.length === 10) {
    return { countryCode: "+91", phoneNumber: digits };
  }
  const defaultCode = process.env.INTERAKT_DEFAULT_COUNTRY_CODE ?? "+91";
  return { countryCode: defaultCode, phoneNumber: digits };
}

export function parseInteraktIncoming(
  body: InteraktWebhookPayload
): { phone: string; text: string } | null {
  if (body.type !== "message_received") return null;
  const phone = phoneFromInteraktCustomer(body.data?.customer?.channel_phone_number);
  const text = body.data?.message?.message?.trim();
  if (!phone || !text) return null;
  return { phone, text };
}

export function verifyInteraktWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const secret = process.env.INTERAKT_WEBHOOK_SECRET?.trim();
  if (!secret) return true;
  if (!signatureHeader) return false;
  const sig = signatureHeader.replace(/^sha256=/i, "");
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  if (sig.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

export function appBaseUrl(): string {
  if (process.env.APP_BASE_URL?.trim()) {
    return process.env.APP_BASE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`;
  }
  return "http://localhost:3000";
}

export function toAbsoluteAppUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${appBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Session / free-form reply within 24h window (Interakt Advanced plan). */
export async function sendInteraktSessionText(
  phone: string,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  if (!isInteraktConfigured()) {
    return { ok: false, error: "INTERAKT_API_KEY not configured" };
  }

  const { countryCode, phoneNumber } = splitPhoneForInterakt(phone);
  const sessionType = process.env.INTERAKT_SESSION_MESSAGE_TYPE ?? "Text";

  const payloads: Record<string, unknown>[] = [
    { countryCode, phoneNumber, type: sessionType, message: text },
    { countryCode, phoneNumber, type: sessionType, data: { message: text } },
  ];

  let lastError = "Failed to send";
  for (const body of payloads) {
    const res = await fetch(MESSAGE_URL, {
      method: "POST",
      headers: {
        Authorization: interaktAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (res.ok) return { ok: true };
    const json = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
    lastError = json.message ?? json.error ?? (await res.text().catch(() => lastError));
    if (res.status !== 400 && res.status !== 422) break;
  }

  return { ok: false, error: lastError };
}

export async function sendInteraktTemplate(params: {
  phone: string;
  templateName: string;
  bodyValues: string[];
  languageCode?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!isInteraktConfigured()) {
    return { ok: false, error: "INTERAKT_API_KEY not configured" };
  }
  const { countryCode, phoneNumber } = splitPhoneForInterakt(params.phone);
  const res = await fetch(MESSAGE_URL, {
    method: "POST",
    headers: {
      Authorization: interaktAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      countryCode,
      phoneNumber,
      type: "Template",
      template: {
        name: params.templateName,
        languageCode: params.languageCode ?? "en",
        bodyValues: params.bodyValues,
      },
    }),
  });
  if (res.ok) return { ok: true };
  const json = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
  return { ok: false, error: json.message ?? json.error ?? "Template send failed" };
}
