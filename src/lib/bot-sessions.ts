import type { BotSession } from "./types";

const sessions = new Map<string, BotSession>();

export function getBotSession(phone: string): BotSession {
  const key = normalizePhone(phone);
  let session = sessions.get(key);
  if (!session) {
    session = {
      phone: key,
      customerId: null,
      verified: false,
      otp: null,
      otpExpiresAt: null,
      step: "welcome",
      pendingDocType: null,
    };
    sessions.set(key, session);
  }
  return session;
}

export function setBotSession(phone: string, session: BotSession): void {
  sessions.set(normalizePhone(phone), session);
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
  return phone.startsWith("+") ? phone : `+${digits}`;
}
