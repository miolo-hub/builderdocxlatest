export type TemplateCategory = "cost_breakup" | "payment_receipt";

export type TemplateFieldType =
  | "text"
  | "number"
  | "select"
  | "section"
  | "computed";

export type TemplateFieldDef = {
  key: string;
  label: string;
  type: TemplateFieldType;
  section?: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  readOnly?: boolean;
  compute?: "basic_flat_cost" | "net_basic" | "gst_amount" | "igst_amount" | "total";
  order: number;
};

export type DocumentTemplateRecord = {
  id: string;
  builderId: string | null;
  category: TemplateCategory;
  name: string;
  description: string | null;
  isSystem: boolean;
  fieldConfig: string;
};

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  cost_breakup: "Cost breakup",
  payment_receipt: "Payment receipts",
};

export const SYSTEM_TEMPLATE_IDS = {
  costBreakupStandard: "tmpl_sys_cost_breakup_standard",
  costBreakupDetailed: "tmpl_sys_cost_breakup_detailed",
  paymentReceiptAdvance: "tmpl_sys_payment_receipt_advance",
} as const;

/** Standard cost breakup — compact fields with auto GST/IGST total */
export const STANDARD_COST_BREAKUP_FIELDS: TemplateFieldDef[] = [
  { key: "sec_project", label: "Project & customer", type: "section", order: 1 },
  { key: "projectName", label: "Project name", type: "text", required: true, order: 2 },
  { key: "unitNo", label: "Flat / unit number", type: "text", required: true, order: 3 },
  { key: "tower", label: "Tower / block", type: "text", order: 4 },
  { key: "floor", label: "Floor", type: "text", order: 5 },
  { key: "sec_area", label: "Area", type: "section", order: 10 },
  { key: "carpetAreaSqft", label: "RERA carpet area (sq.ft)", type: "number", order: 11 },
  { key: "builtUpSqft", label: "Total SBUA / built-up (sq.ft)", type: "number", order: 12 },
  { key: "sec_cost", label: "Cost breakup", type: "section", order: 20 },
  { key: "baseCost", label: "Base cost (Rs.)", type: "number", required: true, order: 21 },
  { key: "floorRise", label: "Floor rise / PLC (Rs.)", type: "number", order: 22 },
  { key: "parkingCharges", label: "Parking (Rs.)", type: "number", order: 23 },
  { key: "infrastructureCharges", label: "Infrastructure charges (Rs.)", type: "number", order: 24 },
  { key: "otherCharges", label: "Other charges (Rs.)", type: "number", order: 25 },
  {
    key: "netBasicCost",
    label: "Net basic cost (A)",
    type: "computed",
    compute: "net_basic",
    readOnly: true,
    order: 26,
  },
  { key: "sec_tax", label: "Tax", type: "section", order: 30 },
  {
    key: "taxType",
    label: "Tax type",
    type: "select",
    required: true,
    options: ["GST", "IGST"],
    order: 31,
  },
  { key: "gstPct", label: "GST %", type: "number", order: 32 },
  { key: "igstPct", label: "IGST %", type: "number", order: 33 },
  {
    key: "gstAmount",
    label: "GST amount (Rs.)",
    type: "computed",
    compute: "gst_amount",
    readOnly: true,
    order: 34,
  },
  {
    key: "igstAmount",
    label: "IGST amount (Rs.)",
    type: "computed",
    compute: "igst_amount",
    readOnly: true,
    order: 35,
  },
  {
    key: "totalAmount",
    label: "Total flat cost (B = A + tax)",
    type: "computed",
    compute: "total",
    readOnly: true,
    order: 36,
  },
  { key: "notes", label: "Notes", type: "text", order: 40 },
];

/** Detailed cost breakup — inspired by builder price sheets (Sipani-style) */
export const DETAILED_COST_BREAKUP_FIELDS: TemplateFieldDef[] = [
  { key: "sec_header", label: "Price sheet header", type: "section", order: 1 },
  { key: "projectName", label: "Project name", type: "text", required: true, order: 2 },
  { key: "sec_unit", label: "Unit details", type: "section", order: 10 },
  { key: "unitType", label: "Unit type (e.g. 2 BHK)", type: "text", order: 11 },
  { key: "bandType", label: "Band type", type: "text", order: 12 },
  { key: "tower", label: "Tower", type: "text", order: 13 },
  { key: "floor", label: "Floor", type: "text", order: 14 },
  { key: "series", label: "Series", type: "text", order: 15 },
  { key: "facing", label: "Facing", type: "text", order: 16 },
  { key: "unitNo", label: "Unit no.", type: "text", required: true, order: 17 },
  { key: "builtUpSqft", label: "Total SBUA (sq.ft)", type: "number", order: 18 },
  { key: "carpetAreaSqft", label: "RERA carpet area (sq.ft)", type: "number", order: 19 },
  { key: "terraceArea", label: "Terrace / balcony area (sq.ft)", type: "number", order: 20 },
  { key: "basePricePerSqft", label: "Base price per sq.ft (Rs.)", type: "number", order: 21 },
  { key: "floorPremium", label: "Floor premium (Rs.)", type: "number", order: 22 },
  { key: "sec_cost", label: "Cost calculation", type: "section", order: 30 },
  {
    key: "basicFlatCost",
    label: "Basic flat cost (Rs.)",
    type: "computed",
    compute: "basic_flat_cost",
    readOnly: true,
    order: 31,
  },
  { key: "semiCoveredParking", label: "Semi-covered parking (Rs.)", type: "number", order: 32 },
  {
    key: "infrastructureCharges",
    label: "Infrastructure charges (Rs.)",
    type: "number",
    order: 33,
  },
  { key: "bescomCharges", label: "BESCOM / BWSSB & other (Rs.)", type: "number", order: 34 },
  { key: "otherCharges", label: "Other charges (Rs.)", type: "number", order: 35 },
  {
    key: "netBasicCost",
    label: "Net basic cost (A)",
    type: "computed",
    compute: "net_basic",
    readOnly: true,
    order: 36,
  },
  { key: "sec_tax", label: "Tax & total", type: "section", order: 40 },
  {
    key: "taxType",
    label: "Tax type",
    type: "select",
    required: true,
    options: ["GST", "IGST"],
    order: 41,
  },
  { key: "gstPct", label: "GST %", type: "number", order: 42 },
  { key: "igstPct", label: "IGST %", type: "number", order: 43 },
  {
    key: "gstAmount",
    label: "GST amount (Rs.)",
    type: "computed",
    compute: "gst_amount",
    readOnly: true,
    order: 44,
  },
  {
    key: "igstAmount",
    label: "IGST amount (Rs.)",
    type: "computed",
    compute: "igst_amount",
    readOnly: true,
    order: 45,
  },
  {
    key: "totalAmount",
    label: "Total flat cost (B = A + tax)",
    type: "computed",
    compute: "total",
    readOnly: true,
    order: 46,
  },
  { key: "maintenance1yr", label: "Maintenance 1 year (Rs.)", type: "number", order: 50 },
  { key: "bookingOffer", label: "Booking offer status", type: "text", order: 51 },
  { key: "notes", label: "Notes / payment plan", type: "text", order: 52 },
];

export const ADVANCE_RECEIPT_FIELDS: TemplateFieldDef[] = [
  { key: "projectName", label: "Project", type: "text", order: 1 },
  { key: "unitNo", label: "Flat / unit", type: "text", order: 2 },
  { key: "tower", label: "Tower", type: "text", order: 3 },
  { key: "amount", label: "Amount received (Rs.)", type: "number", required: true, order: 4 },
  {
    key: "mode",
    label: "Payment mode",
    type: "select",
    options: ["Bank transfer", "Cheque", "Cash", "UPI"],
    order: 5,
  },
  { key: "reference", label: "Reference / UTR", type: "text", order: 6 },
  { key: "paidAt", label: "Payment date", type: "text", order: 7 },
  { key: "notes", label: "Notes", type: "text", order: 8 },
];

export function parseTemplateFields(raw: string): TemplateFieldDef[] {
  try {
    const parsed = JSON.parse(raw) as TemplateFieldDef[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((f) => f.key && f.label)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch {
    return [];
  }
}

export function serializeTemplateFields(fields: TemplateFieldDef[]): string {
  return JSON.stringify(fields.map((f, i) => ({ ...f, order: f.order ?? i + 1 })));
}

export const SYSTEM_TEMPLATE_SEEDS = [
  {
    id: SYSTEM_TEMPLATE_IDS.costBreakupStandard,
    category: "cost_breakup" as TemplateCategory,
    name: "Standard cost breakup",
    description: "Compact breakup with auto GST/IGST and total calculation.",
    fieldConfig: serializeTemplateFields(STANDARD_COST_BREAKUP_FIELDS),
  },
  {
    id: SYSTEM_TEMPLATE_IDS.costBreakupDetailed,
    category: "cost_breakup" as TemplateCategory,
    name: "Detailed price sheet",
    description:
      "Full unit & cost sheet layout (tower, SBUA, parking, BESCOM, GST) like builder price sheets.",
    fieldConfig: serializeTemplateFields(DETAILED_COST_BREAKUP_FIELDS),
  },
  {
    id: SYSTEM_TEMPLATE_IDS.paymentReceiptAdvance,
    category: "payment_receipt" as TemplateCategory,
    name: "Advance payment receipt",
    description: "Receipt for booking advance or token amount.",
    fieldConfig: serializeTemplateFields(ADVANCE_RECEIPT_FIELDS),
  },
];
