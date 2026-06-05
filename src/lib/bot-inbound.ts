import { processBotMessage } from "./bot-engine";
import { deliverBotReplies } from "./bot-whatsapp";

/** Run bot logic and push replies to WhatsApp when Interakt is configured. */
export async function handleInboundBotMessage(phone: string, text: string) {
  const result = await processBotMessage(phone, text);
  await deliverBotReplies(phone, result.messages);
  return result;
}
