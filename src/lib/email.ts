import { getFromR2, isR2Configured, isR2ObjectKey } from "./r2";
import fs from "fs";
import path from "path";

export type EmailAttachment = {
  filename: string;
  content: Buffer;
  contentType: string;
};

export function isEmailConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

async function readFileBytes(filePath: string): Promise<Buffer | null> {
  if (isR2ObjectKey(filePath) && isR2Configured()) {
    const obj = await getFromR2(filePath);
    return obj ? Buffer.from(obj.body) : null;
  }
  if (filePath.startsWith("/uploads/")) {
    const full = path.join(process.cwd(), "public", filePath.replace(/^\//, ""));
    if (fs.existsSync(full)) return fs.readFileSync(full);
  }
  return null;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}): Promise<{ ok: true; id?: string } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    return { ok: false, error: "Email not configured. Set RESEND_API_KEY and EMAIL_FROM." };
  }

  const body: Record<string, unknown> = {
    from,
    to: [opts.to],
    subject: opts.subject,
    html: opts.html,
  };

  if (opts.attachments?.length) {
    body.attachments = opts.attachments.map((a) => ({
      filename: a.filename,
      content: a.content.toString("base64"),
      content_type: a.contentType,
    }));
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!res.ok) {
    return { ok: false, error: data.message ?? `Email send failed (${res.status})` };
  }
  return { ok: true, id: data.id };
}

export async function sendWelcomeEmail(opts: {
  to: string;
  clientName: string;
  builderName: string;
  projectName: string;
  unitLabel?: string;
  brochurePath?: string | null;
  brochureFileName?: string;
}): Promise<{ ok: true; id?: string; brochureAttached: boolean } | { ok: false; error: string }> {
  const unitLine = opts.unitLabel ? `<p>Your unit: <strong>${opts.unitLabel}</strong></p>` : "";
  const html = `
    <div style="font-family: sans-serif; max-width: 560px; color: #1e293b;">
      <p>Dear ${opts.clientName},</p>
      <p>Welcome to <strong>${opts.projectName}</strong>! Your flat booking with ${opts.builderName} is confirmed.</p>
      ${unitLine}
      <p>Please find the project brochure attached for your reference. Our team will guide you through the next steps for documentation and payments.</p>
      <p>Warm regards,<br/>${opts.builderName}</p>
    </div>
  `;

  let attachments: EmailAttachment[] | undefined;
  let brochureAttached = false;
  if (opts.brochurePath) {
    const bytes = await readFileBytes(opts.brochurePath);
    if (bytes) {
      brochureAttached = true;
      attachments = [
        {
          filename: opts.brochureFileName ?? "project-brochure.pdf",
          content: bytes,
          contentType: "application/pdf",
        },
      ];
    }
  }

  const result = await sendEmail({
    to: opts.to,
    subject: `Welcome to ${opts.projectName} — ${opts.builderName}`,
    html,
    attachments,
  });

  if (!result.ok) return result;
  return { ok: true, id: result.id, brochureAttached };
}
