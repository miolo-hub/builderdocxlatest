import { DOCUMENT_TYPE_LABELS, DEMO_OTP } from "./constants";
import {
  formatDocListLine,
  getCustomerAccessibleDocs,
  matchCustomerDoc,
} from "./customer-documents";
import { findCustomerByPhone, getCustomerById } from "./customers-db";
import { getBotSession, setBotSession, normalizePhone } from "./bot-sessions";
import { readStore, addAudit } from "./store";
import { createSignedUrl } from "./signed-url";
import type { BotSession } from "./types";

export interface BotMessage {
  role: "bot" | "user";
  text: string;
  attachment?: { name: string; url: string; type: string };
  timestamp: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export async function processBotMessage(
  phone: string,
  text: string
): Promise<{ messages: BotMessage[]; session: BotSession }> {
  const store = readStore();
  const builder = store.builders[0];
  const session = getBotSession(phone);
  const replies: BotMessage[] = [];
  const now = new Date().toISOString();
  const input = text.trim();
  const lower = input.toLowerCase();

  const push = (t: string, attachment?: BotMessage["attachment"]) => {
    replies.push({ role: "bot", text: t, attachment, timestamp: now });
  };

  replies.push({ role: "user", text: input, timestamp: now });

  if (session.step === "awaiting_otp") {
    if (input === session.otp || input === DEMO_OTP) {
      session.verified = true;
      session.step = "documents_list";
      session.otp = null;
      session.otpExpiresAt = null;
      const customer = session.customerId
        ? await getCustomerById(session.customerId)
        : null;
      const docs = getCustomerAccessibleDocs(session.customerId!);
      addAudit({
        builderId: builder.id,
        action: "customer.otp_verified",
        actor: phone,
        actorType: "customer",
        customerId: session.customerId!,
      });
      push("✅ Verified successfully!");
      if (customer) {
        push(
          `Here are your available documents for Unit ${customer.unit}, ${customer.tower}:\n\n` +
            docs.map((d, i) => formatDocListLine(d, i)).join("\n") +
            "\n\nReply with a document name or number to download."
        );
      }
    } else {
      push("❌ Invalid OTP. Please try again or type *resend* for a new code.");
    }
    setBotSession(phone, session);
    return { messages: replies, session };
  }

  if (lower === "resend" && session.customerId) {
    session.otp = DEMO_OTP;
    session.otpExpiresAt = Date.now() + 5 * 60 * 1000;
    session.step = "awaiting_otp";
    push(
      `We've sent a 6-digit OTP to your registered number.\n\n🔐 Demo OTP: *${DEMO_OTP}*\n\nEnter the OTP to continue.`
    );
    setBotSession(phone, session);
    return { messages: replies, session };
  }

  if (session.step === "documents_list" && session.verified && session.customerId) {
    const doc = matchCustomerDoc(session.customerId, input);
    if (doc) {
      const url = createSignedUrl(doc.filePath);
      addAudit({
        builderId: builder.id,
        action: "document.accessed",
        actor: phone,
        actorType: "customer",
        customerId: session.customerId,
        documentId: doc.id,
        metadata: { channel: "whatsapp_simulator" },
      });
      push(
        `✅ Here is your ${DOCUMENT_TYPE_LABELS[doc.type]} dated ${formatDate(doc.documentDate)}.`,
        { name: doc.fileName, url, type: doc.mimeType }
      );
      push("Need another document? Reply with its name, or type *menu* for options.");
      setBotSession(phone, session);
      return { messages: replies, session };
    }
  }

  const isGreeting =
    /^(hi|hello|hey|start|namaste)/i.test(lower) || session.step === "welcome";

  if (isGreeting || lower === "menu") {
    const customer = await findCustomerByPhone(phone, builder.id);
    session.customerId = customer?.id ?? null;
    session.step = "menu";
    if (!customer) {
      push(
        `Welcome to ${builder.name}! 👋\n\nWe couldn't find your number in our records. Please contact our sales team.`
      );
    } else {
      push(
        `Welcome to ${builder.name}! 👋\n\nHello ${customer.name.split(" ")[0]}, how can I help you today?\n\n` +
          `1️⃣ My Documents\n` +
          `2️⃣ Payment Status\n` +
          `3️⃣ Talk to our Team\n\n` +
          `Reply with 1, 2, or 3.`
      );
    }
    setBotSession(phone, session);
    return { messages: replies, session };
  }

  if (lower === "1" || lower.includes("document")) {
    const customer =
      (await findCustomerByPhone(phone, builder.id)) ??
      (session.customerId
        ? await getCustomerById(session.customerId)
        : null);
    if (!customer) {
      push("Please register your number with us first. Type *hi* to start.");
      setBotSession(phone, session);
      return { messages: replies, session };
    }
    session.customerId = customer.id;
    session.verified = false;
    session.otp = DEMO_OTP;
    session.otpExpiresAt = Date.now() + 5 * 60 * 1000;
    session.step = "awaiting_otp";
    addAudit({
      builderId: builder.id,
      action: "customer.otp_sent",
      actor: phone,
      actorType: "customer",
      customerId: customer.id,
    });
    push(
      `🔐 For your security, please verify your identity.\n\nWe've sent a 6-digit OTP to ${customer.phone}.\n\n*Demo OTP:* ${DEMO_OTP}\n\nEnter the OTP to view your documents.`
    );
    setBotSession(phone, session);
    return { messages: replies, session };
  }

  if (lower === "2" || lower.includes("payment")) {
    session.step = "payment_status";
    const customer = await findCustomerByPhone(phone, builder.id);
    if (customer) {
      push(
        `💳 *Payment Status* — Unit ${customer.unit}, ${customer.tower}\n\n` +
          `• Booking amount: ✅ Received (5 Oct 2024)\n` +
          `• 1st installment: ✅ Received (15 Jan 2025)\n` +
          `• 2nd installment: ⏳ Due 15 Jul 2025\n\n` +
          `For detailed receipts, choose *1️⃣ My Documents* and select Payment Receipt (if shared with you).`
      );
    } else {
      push("Please verify your registered mobile number first. Type *hi* to begin.");
    }
    setBotSession(phone, session);
    return { messages: replies, session };
  }

  if (lower === "3" || lower.includes("team") || lower.includes("talk")) {
    session.step = "team_handoff";
    push(
      `📞 Our team will reach out shortly!\n\n` +
        `Sales: +91 80 2555 0100\n` +
        `Email: care@prestige.demo\n` +
        `Hours: Mon–Sat, 9 AM – 6 PM\n\n` +
        `Your request has been logged. Reference: #${Date.now().toString(36).toUpperCase()}`
    );
    addAudit({
      builderId: builder.id,
      action: "customer.team_request",
      actor: phone,
      actorType: "customer",
      customerId: session.customerId ?? undefined,
    });
    setBotSession(phone, session);
    return { messages: replies, session };
  }

  push(
    `I didn't quite understand that. Type *hi* or *menu* to see options:\n\n1️⃣ My Documents\n2️⃣ Payment Status\n3️⃣ Talk to our Team`
  );
  setBotSession(phone, session);
  return { messages: replies, session };
}

export function resetBotSession(phone: string): void {
  setBotSession(phone, {
    phone: normalizePhone(phone),
    customerId: null,
    verified: false,
    otp: null,
    otpExpiresAt: null,
    step: "welcome",
    pendingDocType: null,
  });
}
