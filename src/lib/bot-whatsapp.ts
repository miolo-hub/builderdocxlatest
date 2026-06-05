import type { BotMessage } from "./bot-engine";
import {
  isInteraktConfigured,
  sendInteraktSessionText,
  sendInteraktTemplate,
  toAbsoluteAppUrl,
} from "./interakt";

const MAX_WHATSAPP_CHARS = 4000;

function chunkText(text: string): string[] {
  if (text.length <= MAX_WHATSAPP_CHARS) return [text];
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > MAX_WHATSAPP_CHARS) {
    let cut = rest.lastIndexOf("\n", MAX_WHATSAPP_CHARS);
    if (cut < MAX_WHATSAPP_CHARS * 0.5) cut = MAX_WHATSAPP_CHARS;
    chunks.push(rest.slice(0, cut));
    rest = rest.slice(cut).trimStart();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

/** Deliver bot-engine replies to WhatsApp via Interakt (production). */
export async function deliverBotReplies(
  phone: string,
  messages: BotMessage[]
): Promise<void> {
  if (!isInteraktConfigured()) return;

  const botMessages = messages.filter((m) => m.role === "bot");
  for (const msg of botMessages) {
    let text = msg.text;
    if (msg.attachment?.url) {
      const docUrl = toAbsoluteAppUrl(msg.attachment.url);
      text += `\n\n📎 ${msg.attachment.name}\n${docUrl}`;
    }

    for (const chunk of chunkText(text)) {
      const result = await sendInteraktSessionText(phone, chunk);
      if (!result.ok) {
        console.error("[interakt] session message failed:", result.error);
        const fallbackTemplate = process.env.INTERAKT_BOT_REPLY_TEMPLATE?.trim();
        if (fallbackTemplate) {
          await sendInteraktTemplate({
            phone,
            templateName: fallbackTemplate,
            bodyValues: [chunk.slice(0, 1000)],
          });
        }
      }
    }
  }
}
