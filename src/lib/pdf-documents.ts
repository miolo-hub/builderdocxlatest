import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { SYSTEM_TEMPLATE_IDS, type TemplateFieldDef } from "./document-templates";
import { applyTemplateCalculations } from "./template-calculations";

function formatInr(n: number | string | undefined): string {
  const v = typeof n === "string" ? parseFloat(n) : n;
  if (v === undefined || Number.isNaN(v)) return "-";
  return `Rs. ${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function sanitizeText(text: string): string {
  return text.replace(/\u20B9/g, "Rs.").replace(/[^\x00-\xFF]/g, "?");
}

type PdfCtx = {
  doc: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  bold: PDFFont;
  y: number;
  margin: number;
  width: number;
};

function newPage(ctx: PdfCtx): PdfCtx {
  const page = ctx.doc.addPage([595, 842]);
  return { ...ctx, page, y: page.getSize().height - 50 };
}

function ensureSpace(ctx: PdfCtx, needed: number): PdfCtx {
  if (ctx.y - needed < 60) return newPage(ctx);
  return ctx;
}

function drawLine(ctx: PdfCtx, text: string, size = 10, bold = false): PdfCtx {
  let c = ensureSpace(ctx, size + 6);
  c.page.drawText(sanitizeText(text), {
    x: c.margin,
    y: c.y,
    size,
    font: bold ? c.bold : c.font,
    color: rgb(0.15, 0.15, 0.15),
  });
  return { ...c, y: c.y - size - 6 };
}

function drawRow(ctx: PdfCtx, label: string, value: string, valueX = 280): PdfCtx {
  let c = ensureSpace(ctx, 16);
  c.page.drawText(sanitizeText(label), {
    x: c.margin,
    y: c.y,
    size: 10,
    font: c.bold,
    color: rgb(0.2, 0.2, 0.2),
  });
  c.page.drawText(sanitizeText(value), {
    x: valueX,
    y: c.y,
    size: 10,
    font: c.font,
    color: rgb(0.1, 0.1, 0.1),
  });
  return { ...c, y: c.y - 16 };
}

function drawTableRow(ctx: PdfCtx, cells: string[], bold = false): PdfCtx {
  let c = ensureSpace(ctx, 18);
  const colWidth = (c.width - c.margin * 2) / Math.max(cells.length, 1);
  cells.forEach((text, i) => {
    c.page.drawText(sanitizeText(text), {
      x: c.margin + i * colWidth + 4,
      y: c.y,
      size: 9,
      font: bold ? c.bold : c.font,
    });
  });
  c.page.drawLine({
    start: { x: c.margin, y: c.y - 4 },
    end: { x: c.width - c.margin, y: c.y - 4 },
    thickness: 0.5,
    color: rgb(0.88, 0.88, 0.88),
  });
  return { ...c, y: c.y - 18 };
}

async function startPdf(title: string, builderName: string): Promise<PdfCtx> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([595, 842]);
  const { height, width } = page.getSize();
  const margin = 45;

  page.drawText(sanitizeText(builderName), {
    x: margin,
    y: height - 36,
    size: 9,
    font,
    color: rgb(0.45, 0.45, 0.45),
  });
  page.drawText(sanitizeText(title), {
    x: margin,
    y: height - 56,
    size: 14,
    font: bold,
    color: rgb(0.08, 0.32, 0.32),
  });
  page.drawLine({
    start: { x: margin, y: height - 62 },
    end: { x: width - margin, y: height - 62 },
    thickness: 1.5,
    color: rgb(0.12, 0.45, 0.45),
  });

  return { doc, page, font, bold, y: height - 78, margin, width };
}

function displayValue(field: TemplateFieldDef, val: string): string {
  if (!val) return "-";
  const isMoney =
    field.type === "computed" ||
    (field.type === "number" &&
      !field.key.includes("Pct") &&
      !field.key.includes("Sqft") &&
      !field.key.includes("sqft") &&
      !field.key.includes("Area") &&
      field.key !== "basePricePerSqft");
  if (isMoney) {
    const n = parseFloat(val.replace(/,/g, ""));
    if (!Number.isNaN(n)) return formatInr(n);
  }
  if (field.type === "number" && field.key.includes("Pct")) return `${val}%`;
  return val;
}

function isMoneyField(field: TemplateFieldDef): boolean {
  return (
    field.type === "computed" ||
    (field.type === "number" &&
      !field.key.includes("Pct") &&
      !field.key.includes("Sqft") &&
      field.key !== "basePricePerSqft")
  );
}

async function generateDetailedPriceSheetPdf(
  builderName: string,
  clientName: string,
  fields: TemplateFieldDef[],
  values: Record<string, string>
): Promise<Uint8Array> {
  const computed = applyTemplateCalculations(fields, values);
  const project = computed.projectName ?? "Project";
  let ctx = await startPdf(
    `Price sheet for your unit at ${project}`,
    builderName
  );

  ctx = drawLine(ctx, `Customer name: ${clientName}`, 11, true);
  ctx = drawLine(ctx, `Date: ${new Date().toLocaleDateString("en-IN")}`, 9);
  ctx = { ...ctx, y: ctx.y - 8 };

  let inUnitSection = false;
  let inCostSection = false;
  const unitRows: TemplateFieldDef[] = [];
  const costRows: TemplateFieldDef[] = [];
  const otherRows: TemplateFieldDef[] = [];

  for (const f of fields) {
    if (f.type === "section") {
      if (f.key === "sec_unit") inUnitSection = true;
      else if (f.key === "sec_cost" || f.key === "sec_tax") inUnitSection = false;
      if (f.key === "sec_cost") inCostSection = true;
      else if (f.key === "sec_tax") inCostSection = false;
      continue;
    }
    if (f.type === "computed" || f.type === "number" || f.type === "text") {
      if (inUnitSection && !inCostSection) unitRows.push(f);
      else if (inCostSection || f.compute) costRows.push(f);
      else otherRows.push(f);
    }
  }

  if (unitRows.length > 0) {
    ctx = drawLine(ctx, "Unit details", 11, true);
    ctx = drawTableRow(ctx, ["Field", "Value"], true);
    for (let i = 0; i < unitRows.length; i += 2) {
      const a = unitRows[i];
      const b = unitRows[i + 1];
      const valA = computed[a.key] ? displayValue(a, computed[a.key]) : "-";
      const valB = b && computed[b.key] ? displayValue(b, computed[b.key]) : "";
      const cells = [`${a.label}: ${valA}`];
      if (b) cells.push(`${b.label}: ${valB}`);
      ctx = drawTableRow(ctx, cells);
    }
    ctx = { ...ctx, y: ctx.y - 6 };
  }

  if (costRows.length > 0) {
    ctx = drawLine(ctx, "Cost calculation", 11, true);
    ctx = drawTableRow(ctx, ["Particulars", "Amount (Rs.)"], true);
    for (const f of costRows) {
      const val = computed[f.key];
      if (!val && f.type !== "computed" && !f.compute) continue;
      const isTotal = f.key === "totalAmount" || f.compute === "total";
      ctx = drawTableRow(
        ctx,
        [f.label, val ? displayValue(f, val) : "-"],
        isTotal
      );
    }
    ctx = { ...ctx, y: ctx.y - 6 };
  }

  for (const f of otherRows) {
    const val = computed[f.key];
    if (!val) continue;
    ctx = drawRow(ctx, f.label, displayValue(f, val), 320);
  }

  ctx = { ...ctx, y: ctx.y - 10 };
  ctx = drawLine(
    ctx,
    "This price sheet is system-generated. Final terms subject to signed agreement.",
    8
  );

  return ctx.doc.save();
}

export async function generateTemplatePdf(
  builderName: string,
  clientName: string,
  templateName: string,
  fields: TemplateFieldDef[],
  values: Record<string, string>,
  templateId?: string
): Promise<Uint8Array> {
  if (templateId === SYSTEM_TEMPLATE_IDS.costBreakupDetailed) {
    return generateDetailedPriceSheetPdf(builderName, clientName, fields, values);
  }

  const computed = applyTemplateCalculations(fields, values);
  let ctx = await startPdf(templateName, builderName);
  ctx = drawLine(ctx, `Prepared for: ${clientName}`, 11, true);
  ctx = drawLine(ctx, `Date: ${new Date().toLocaleDateString("en-IN")}`, 10);
  ctx = { ...ctx, y: ctx.y - 10 };

  for (const field of fields) {
    if (field.type === "section") {
      ctx = { ...ctx, y: ctx.y - 6 };
      ctx = drawLine(ctx, field.label, 12, true);
      continue;
    }
    const val = computed[field.key];
    if (val === undefined || val === "") continue;
    const isTotal = field.compute === "total" || field.key === "totalAmount";
    if (isTotal) ctx = { ...ctx, y: ctx.y - 4 };
    ctx = drawRow(
      ctx,
      field.label,
      displayValue(field, val),
      isMoneyField(field) ? 300 : 280
    );
  }

  ctx = { ...ctx, y: ctx.y - 8 };
  ctx = drawLine(
    ctx,
    "System-generated document. Final terms subject to signed agreement.",
    8
  );

  return ctx.doc.save();
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
  let ctx = await startPdf("Advance Payment Receipt", builderName);

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
    ctx = drawRow(ctx, label, value);
  }

  ctx = drawLine(ctx, "Thank you for your payment.", 10);

  return ctx.doc.save();
}

export async function generatePriceBreakupPdf(
  builderName: string,
  clientName: string,
  fields: TemplateFieldDef[],
  values: Record<string, string>
): Promise<Uint8Array> {
  return generateTemplatePdf(builderName, clientName, "Price Breakup Letter", fields, values);
}
