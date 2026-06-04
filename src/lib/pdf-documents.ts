import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { PriceBreakupFieldDef } from "./price-breakup-fields";

function formatInr(n: number | string | undefined): string {
  const v = typeof n === "string" ? parseFloat(n) : n;
  if (v === undefined || Number.isNaN(v)) return "—";
  return `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

async function basePdf(title: string, builderName: string) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([595, 842]);
  const { height } = page.getSize();
  let y = height - 50;

  page.drawText(builderName, { x: 50, y, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
  y -= 24;
  page.drawText(title, { x: 50, y, size: 18, font: bold, color: rgb(0.1, 0.35, 0.35) });
  y -= 8;
  page.drawLine({
    start: { x: 50, y },
    end: { x: 545, y },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });

  return { doc, page, font, bold, y: y - 24 };
}

export async function generatePriceBreakupPdf(
  builderName: string,
  clientName: string,
  fields: PriceBreakupFieldDef[],
  values: Record<string, string>
): Promise<Uint8Array> {
  const { doc, page, font, bold, y: startY } = await basePdf(
    "Price Breakup Letter",
    builderName
  );
  let y = startY;

  page.drawText(`Prepared for: ${clientName}`, { x: 50, y, size: 11, font: bold });
  y -= 22;
  page.drawText(`Date: ${new Date().toLocaleDateString("en-IN")}`, {
    x: 50,
    y,
    size: 10,
    font,
  });
  y -= 28;

  for (const field of fields) {
    const val = values[field.key];
    if (val === undefined || val === "") continue;
    const display =
      field.type === "number" && !field.key.includes("Pct") && !field.key.includes("Area")
        ? formatInr(val)
        : String(val);

    page.drawText(field.label, { x: 50, y, size: 10, font: bold });
    page.drawText(display, { x: 280, y, size: 10, font });
    y -= 18;
    if (y < 80) break;
  }

  y -= 12;
  page.drawText(
    "This is a system-generated price breakup for internal use. Final terms subject to agreement.",
    { x: 50, y: Math.max(40, y),
      size: 8,
      font,
      color: rgb(0.45, 0.45, 0.45),
      maxWidth: 495,
    }
  );

  return doc.save();
}

export async function generateAdvanceReceiptPdf(
  builderName: string,
  clientName: string,
  data: {
    amount: number;
    mode: string;
    reference?: string;
    paidAt: string;
    projectName?: string;
    flatNumber?: string;
    tower?: string;
  }
): Promise<Uint8Array> {
  const { doc, page, font, bold, y: startY } = await basePdf(
    "Advance Payment Receipt",
    builderName
  );
  let y = startY;

  const lines: [string, string][] = [
    ["Received from", clientName],
    ["Amount", formatInr(data.amount)],
    ["Payment mode", data.mode],
    ["Paid on", new Date(data.paidAt).toLocaleDateString("en-IN")],
  ];
  if (data.reference) lines.push(["Reference", data.reference]);
  if (data.projectName) lines.push(["Project", data.projectName]);
  if (data.flatNumber) lines.push(["Flat", data.flatNumber]);
  if (data.tower) lines.push(["Tower", data.tower]);

  for (const [label, value] of lines) {
    page.drawText(label, { x: 50, y, size: 11, font: bold });
    page.drawText(value, { x: 220, y, size: 11, font });
    y -= 22;
  }

  y -= 16;
  page.drawText("Thank you for your payment.", {
    x: 50,
    y,
    size: 10,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  return doc.save();
}
