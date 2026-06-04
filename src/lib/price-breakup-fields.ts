export type PriceBreakupFieldType = "text" | "number" | "select";

export type PriceBreakupFieldDef = {
  key: string;
  label: string;
  type: PriceBreakupFieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  order: number;
};

export const DEFAULT_PRICE_BREAKUP_FIELDS: PriceBreakupFieldDef[] = [
  { key: "projectName", label: "Project name", type: "text", required: true, order: 1 },
  { key: "flatNumber", label: "Flat / unit number", type: "text", required: true, order: 2 },
  { key: "tower", label: "Tower / block", type: "text", order: 3 },
  { key: "carpetAreaSqft", label: "Carpet area (sq.ft)", type: "number", required: true, order: 4 },
  { key: "builtUpSqft", label: "Built-up area (sq.ft)", type: "number", order: 5 },
  { key: "baseCost", label: "Base cost (₹)", type: "number", required: true, order: 6 },
  { key: "floorRise", label: "Floor rise / PLC (₹)", type: "number", order: 7 },
  { key: "parkingCharges", label: "Parking charges (₹)", type: "number", order: 8 },
  { key: "otherCharges", label: "Other charges (₹)", type: "number", order: 9 },
  {
    key: "taxType",
    label: "GST type",
    type: "select",
    required: true,
    options: ["GST", "IGST"],
    order: 10,
  },
  { key: "gstPct", label: "GST %", type: "number", order: 11 },
  { key: "igstPct", label: "IGST %", type: "number", order: 12 },
  { key: "gstAmount", label: "GST amount (₹)", type: "number", order: 13 },
  { key: "igstAmount", label: "IGST amount (₹)", type: "number", order: 14 },
  { key: "totalAmount", label: "Total amount (₹)", type: "number", required: true, order: 15 },
  { key: "notes", label: "Notes", type: "text", order: 16 },
];

export function parseFieldConfig(raw: string | null | undefined): PriceBreakupFieldDef[] {
  if (!raw?.trim()) return DEFAULT_PRICE_BREAKUP_FIELDS;
  try {
    const parsed = JSON.parse(raw) as PriceBreakupFieldDef[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_PRICE_BREAKUP_FIELDS;
    }
    return parsed
      .filter((f) => f.key && f.label)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch {
    return DEFAULT_PRICE_BREAKUP_FIELDS;
  }
}

export function serializeFieldConfig(fields: PriceBreakupFieldDef[]): string {
  return JSON.stringify(
    fields.map((f, i) => ({ ...f, order: f.order ?? i + 1 }))
  );
}

export function buildDefaultValues(
  fields: PriceBreakupFieldDef[],
  client: {
    name: string;
    projectName?: string | null;
    unit?: string | null;
    tower?: string | null;
    preferredUnit?: {
      unitNumber: string;
      block: string | null;
      areaSqft: number | null;
      project: { name: string };
    } | null;
  }
): Record<string, string> {
  const values: Record<string, string> = {};
  const unit = client.preferredUnit;
  for (const f of fields) {
    switch (f.key) {
      case "projectName":
        values[f.key] = client.projectName ?? unit?.project.name ?? "";
        break;
      case "flatNumber":
        values[f.key] = client.unit ?? unit?.unitNumber ?? "";
        break;
      case "tower":
        values[f.key] = client.tower ?? unit?.block ?? "";
        break;
      case "carpetAreaSqft":
      case "builtUpSqft":
        if (unit?.areaSqft) values[f.key] = String(unit.areaSqft);
        break;
      default:
        values[f.key] = f.type === "select" && f.options?.[0] ? f.options[0] : "";
    }
  }
  return values;
}
