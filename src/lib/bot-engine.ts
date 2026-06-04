import { DOCUMENT_TYPE_LABELS } from "./constants";
import {
  formatDocListLine,
  getClientAccessibleDocs,
  matchCustomerDoc,
} from "./customer-documents";
import { findClientByPhone, getClientById } from "./clients-db";
import { getBuilderById } from "./builders-db";
import { getBotSession, setBotSession, normalizePhone } from "./bot-sessions";
import { getPrisma } from "./prisma";
import { createSignedUrl } from "./signed-url";
import type { BotSession } from "./types";

export interface BotMessage {
  role: "bot" | "user";
  text: string;
  attachment?: { name: string; url: string; type: string };
  timestamp: string;
}

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

async function logWhatsApp(clientId: string, direction: string, message: string) {
  try {
    await getPrisma().whatsAppLog.create({
      data: {
        id: `wa_${Date.now()}`,
        clientId,
        direction,
        message: message.slice(0, 2000),
      },
    });
  } catch {
    /* non-blocking */
  }
}

async function resolveClient(phone: string, session: BotSession) {
  if (session.customerId) {
    const byId = await getClientById(session.customerId);
    if (byId) return byId;
  }
  return findClientByPhone(phone);
}

function otpMatches(
  input: string,
  session: BotSession,
  builderOtp: string | null | undefined
) {
  return input === session.otp || (!!builderOtp && input === builderOtp);
}

function formatBuilderContact(builder: {
  name: string;
  phone: string | null;
  email: string | null;
  supportHours: string | null;
}) {
  let msg = `📍 ${builder.name}`;
  if (builder.phone) msg += `\nPhone: ${builder.phone}`;
  if (builder.email) msg += `\nEmail: ${builder.email}`;
  if (builder.supportHours) msg += `\nHours: ${builder.supportHours}`;
  return msg;
}

async function paymentSummary(clientId: string): Promise<string> {
  const deal = await getPrisma().deal.findFirst({
    where: { clientId },
    include: { schedule: { orderBy: { dueDate: "asc" } }, unit: { include: { project: true } } },
  });
  if (!deal) return "No active deal found. Contact our sales team.";
  const next = deal.schedule.find((s) => s.status !== "paid");
  const unitLabel = `${deal.unit.unitNumber} — ${deal.unit.project.name}`;
  let msg = `💳 *Payment Status* — ${unitLabel}\n\nDeal value: ₹${deal.finalPrice.toLocaleString("en-IN")}\n`;
  for (const s of deal.schedule) {
    const icon = s.status === "paid" ? "✅" : s.dueDate < new Date() ? "⚠️" : "⏳";
    msg += `${icon} #${s.installmentNumber}: ₹${s.amount.toLocaleString("en-IN")} — due ${formatDate(s.dueDate)} (${s.status})\n`;
  }
  if (next) {
    msg += `\n*Next payment:* ₹${next.amount.toLocaleString("en-IN")} on ${formatDate(next.dueDate)}`;
  }
  return msg;
}

async function constructionUpdate(clientId: string): Promise<string> {
  const deal = await getPrisma().deal.findFirst({
    where: { clientId },
    include: { unit: { include: { project: { include: { milestones: { orderBy: { completedAt: "desc" }, take: 1 } } } } } },
  });
  const project = deal?.unit?.project;
  if (!project) return "No project linked to your account.";
  const m = project.milestones[0];
  return (
    `🏗 *${project.name}*\n\n` +
    `Overall completion: *${project.constructionPct}%*\n` +
    (m ? `Latest: ${m.title} (${formatDate(m.completedAt)})\n` : "") +
    (project.possessionDate
      ? `Expected possession: ${formatDate(project.possessionDate)}`
      : "")
  );
}

export async function processBotMessage(
  phone: string,
  text: string
): Promise<{ messages: BotMessage[]; session: BotSession }> {
  const session = getBotSession(phone);
  const replies: BotMessage[] = [];
  const now = new Date().toISOString();
  const input = text.trim();
  const lower = input.toLowerCase();

  const push = (t: string, attachment?: BotMessage["attachment"]) => {
    replies.push({ role: "bot", text: t, attachment, timestamp: now });
  };

  replies.push({ role: "user", text: input, timestamp: now });

  const clientForOtp = await resolveClient(phone, session);
  const builderForOtp = clientForOtp
    ? await getBuilderById(clientForOtp.builderId)
    : null;
  const demoOtp = builderForOtp?.whatsappDemoOtp ?? null;

  if (session.step === "awaiting_otp") {
    if (otpMatches(input, session, demoOtp)) {
      session.verified = true;
      session.step = "documents_list";
      session.otp = null;
      const client = session.customerId
        ? await getClientById(session.customerId)
        : null;
      const docs = session.customerId
        ? await getClientAccessibleDocs(session.customerId)
        : [];
      push("✅ Verified successfully!");
      if (client) {
        await logWhatsApp(client.id, "inbound", input);
        const unit = client.unit ? `Unit ${client.unit}` : "your property";
        push(
          `Welcome ${client.name.split(" ")[0]}! Documents for ${unit}:\n\n` +
            docs.map((d, i) => formatDocListLine(d, i)).join("\n") +
            "\n\nReply with name or number. Type *menu* for full options."
        );
      }
    } else {
      push("❌ Invalid OTP. Type *resend* for a new code.");
    }
    setBotSession(phone, session);
    return { messages: replies, session };
  }

  if (lower === "resend" && session.customerId) {
    if (!demoOtp) {
      push("OTP is not configured for this builder. Please contact support.");
    } else {
      session.otp = demoOtp;
      session.step = "awaiting_otp";
      push(`🔐 Your OTP: *${demoOtp}*`);
    }
    setBotSession(phone, session);
    return { messages: replies, session };
  }

  if (session.step === "documents_list" && session.verified && session.customerId) {
    const doc = await matchCustomerDoc(session.customerId, input);
    if (doc) {
      const url = createSignedUrl(doc.filePath);
      await logWhatsApp(session.customerId, "outbound", `Sent ${doc.title}`);
      push(
        `✅ Here is your ${DOCUMENT_TYPE_LABELS[doc.type] ?? doc.title} dated ${formatDate(doc.documentDate)}.`,
        { name: doc.fileName, url, type: doc.mimeType }
      );
      setBotSession(phone, session);
      return { messages: replies, session };
    }
  }

  const isGreeting =
    /^(hi|hello|hey|start|namaste|help)/i.test(lower) || session.step === "welcome";

  if (isGreeting || lower === "menu") {
    const client = await resolveClient(phone, session);
    session.customerId = client?.id ?? null;
    session.step = "menu";
    const builder = client ? await getBuilderById(client.builderId) : null;
    const builderName = builder?.name ?? "Builder";
    if (!client) {
      push(
        `Welcome to ${builderName}! 👋\n\nWe couldn't find your number. Please contact sales.`
      );
    } else {
      await logWhatsApp(client.id, "inbound", input);
      push(
        `Welcome to ${builderName}! 👋\n\nHello ${client.name.split(" ")[0]}:\n\n` +
          `1️⃣ My Payment Schedule\n` +
          `2️⃣ Request a Document\n` +
          `3️⃣ Project Construction Update\n` +
          `4️⃣ Speak to My Sales Agent\n` +
          `5️⃣ Company Contact\n\n` +
          `Reply 1–5.`
      );
    }
    setBotSession(phone, session);
    return { messages: replies, session };
  }

  if (lower === "1" || lower.includes("payment")) {
    const client = await resolveClient(phone, session);
    if (!client) {
      push("Please verify your number. Type *hi* to start.");
    } else if (!session.verified) {
      session.customerId = client.id;
      if (!demoOtp) {
        push("OTP is not configured. Please contact support.");
      } else {
        session.otp = demoOtp;
        session.step = "awaiting_otp";
        push(`🔐 Enter OTP *${demoOtp}* to view payment details.`);
      }
    } else {
      push(await paymentSummary(client.id));
    }
    setBotSession(phone, session);
    return { messages: replies, session };
  }

  if (lower === "2" || lower.includes("document")) {
    const client = await resolveClient(phone, session);
    if (!client) {
      push("Number not registered. Type *hi*.");
    } else if (!demoOtp) {
      push("OTP is not configured. Please contact support.");
    } else {
      session.customerId = client.id;
      session.verified = false;
      session.otp = demoOtp;
      session.step = "awaiting_otp";
      push(`🔐 Enter OTP *${demoOtp}* to access documents.`);
    }
    setBotSession(phone, session);
    return { messages: replies, session };
  }

  if (lower === "3" || lower.includes("construction") || lower.includes("update")) {
    const client = await resolveClient(phone, session);
    if (client && session.verified) {
      push(await constructionUpdate(client.id));
    } else if (client && demoOtp) {
      session.step = "awaiting_otp";
      session.otp = demoOtp;
      session.customerId = client.id;
      push(`🔐 Enter OTP *${demoOtp}* first.`);
    } else if (client) {
      push("OTP is not configured. Please contact support.");
    } else {
      push("Type *hi* to begin.");
    }
    setBotSession(phone, session);
    return { messages: replies, session };
  }

  if (lower === "4" || lower.includes("agent")) {
    const client = await resolveClient(phone, session);
    const builder = client ? await getBuilderById(client.builderId) : null;
    if (client?.assignedAgentId) {
      const agent = await getPrisma().agent.findUnique({
        where: { id: client.assignedAgentId },
      });
      push(
        agent
          ? `📞 Your agent: *${agent.name}*\nPhone: ${agent.phone}\nWhatsApp: ${agent.whatsapp ?? agent.phone}`
          : builder
            ? `Agent details not available.\n${formatBuilderContact(builder)}`
            : "Agent details not available."
      );
    } else if (builder) {
      push(formatBuilderContact(builder));
    } else {
      push("Please type *hi* to start.");
    }
    setBotSession(phone, session);
    return { messages: replies, session };
  }

  if (lower === "5" || lower.includes("contact")) {
    const client = await resolveClient(phone, session);
    const builder = client
      ? await getBuilderById(client.builderId)
      : await getPrisma().builder.findFirst({ orderBy: { name: "asc" } });
    if (builder) {
      push(formatBuilderContact(builder));
    } else {
      push("Contact information is not available.");
    }
    setBotSession(phone, session);
    return { messages: replies, session };
  }

  push(`Type *menu* for options (1–5).`);
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
