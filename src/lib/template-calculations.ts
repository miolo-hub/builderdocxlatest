import type { TemplateFieldDef } from "./document-templates";

function num(values: Record<string, string>, key: string): number {
  const v = parseFloat(values[key] ?? "");
  return Number.isNaN(v) ? 0 : v;
}

function set(values: Record<string, string>, key: string, n: number): void {
  values[key] = Number.isFinite(n) ? String(Math.round(n * 100) / 100) : "0";
}

export function applyTemplateCalculations(
  fields: TemplateFieldDef[],
  input: Record<string, string>
): Record<string, string> {
  const hasTaxFields = fields.some((f) => f.key === "taxType" || f.compute === "net_basic");
  if (!hasTaxFields) return { ...input };

  const values = { ...input };

  const taxType = values.taxType ?? "GST";
  const hasDetailed = fields.some((f) => f.key === "basicFlatCost");

  if (hasDetailed) {
    const sbua = num(values, "builtUpSqft") || num(values, "carpetAreaSqft");
    const rate = num(values, "basePricePerSqft");
    const premium = num(values, "floorPremium");
    set(values, "basicFlatCost", sbua * rate + premium);
  }

  const netKeys = hasDetailed
    ? ["basicFlatCost", "semiCoveredParking", "infrastructureCharges", "bescomCharges", "otherCharges"]
    : ["baseCost", "floorRise", "parkingCharges", "infrastructureCharges", "otherCharges"];

  const netBasic = netKeys.reduce((sum, k) => sum + num(values, k), 0);
  set(values, "netBasicCost", netBasic);

  const gstPct = num(values, "gstPct");
  const igstPct = num(values, "igstPct");

  if (taxType === "GST") {
    set(values, "gstAmount", (netBasic * gstPct) / 100);
    set(values, "igstAmount", 0);
  } else {
    set(values, "igstAmount", (netBasic * igstPct) / 100);
    set(values, "gstAmount", 0);
  }

  const total =
    num(values, "netBasicCost") + num(values, "gstAmount") + num(values, "igstAmount");
  set(values, "totalAmount", total);

  return values;
}

type PrefillUnit = {
  unitNumber: string;
  block: string | null;
  floor: string | null;
  areaSqft: number | null;
  basePrice?: number;
  facing?: string | null;
  project: { name: string };
};

function resolvePrefillUnit(client: {
  unit?: string | null;
  tower?: string | null;
  projectName?: string | null;
  preferredUnit?: PrefillUnit | null;
  deals?: { unit: Omit<PrefillUnit, "project"> }[];
}): PrefillUnit | null {
  if (client.preferredUnit) return client.preferredUnit;
  const dealUnit = client.deals?.[0]?.unit;
  if (!dealUnit) return null;
  return {
    ...dealUnit,
    project: { name: client.projectName ?? "" },
  };
}

export function buildClientPrefill(
  fields: TemplateFieldDef[],
  client: {
    name: string;
    projectName?: string | null;
    unit?: string | null;
    tower?: string | null;
    preferredUnit?: PrefillUnit | null;
    deals?: { unit: Omit<PrefillUnit, "project"> }[];
  }
): Record<string, string> {
  const linked = resolvePrefillUnit(client);
  const values: Record<string, string> = {};
  for (const f of fields) {
    if (f.type === "section" || f.type === "computed") continue;
    switch (f.key) {
      case "projectName":
        values[f.key] = client.projectName ?? linked?.project.name ?? "";
        break;
      case "unitNo":
      case "flatNumber":
        values[f.key] = client.unit ?? linked?.unitNumber ?? "";
        break;
      case "tower":
        values[f.key] = client.tower ?? linked?.block ?? "";
        break;
      case "floor":
        values[f.key] = linked?.floor ?? "";
        break;
      case "facing":
        values[f.key] = linked?.facing ?? "";
        break;
      case "carpetAreaSqft":
      case "builtUpSqft":
        if (linked?.areaSqft) {
          values[f.key] = String(linked.areaSqft);
        } else {
          values[f.key] = "";
        }
        break;
      case "basePricePerSqft":
        if (linked?.areaSqft && linked.basePrice && linked.areaSqft > 0) {
          values[f.key] = String(Math.round(linked.basePrice / linked.areaSqft));
        } else {
          values[f.key] = "";
        }
        break;
      case "taxType":
        values[f.key] = f.options?.[0] ?? "GST";
        break;
      case "gstPct":
        values[f.key] = "5";
        break;
      case "igstPct":
        values[f.key] = "0";
        break;
      case "paidAt":
        values[f.key] = new Date().toISOString().slice(0, 10);
        break;
      case "mode":
        values[f.key] = f.options?.[0] ?? "";
        break;
      default:
        values[f.key] = "";
    }
  }
  return applyTemplateCalculations(fields, values);
}

/** Prefill payment receipt from client + prior price breakup workflow data */
export function buildReceiptPrefill(
  fields: TemplateFieldDef[],
  client: {
    name: string;
    projectName?: string | null;
    unit?: string | null;
    tower?: string | null;
  },
  priceBreakup?: Record<string, string | number> | null
): Record<string, string> {
  const pb = priceBreakup ?? {};
  const str = (k: string) => String(pb[k] ?? "");

  const values: Record<string, string> = {};
  for (const f of fields) {
    if (f.type === "section" || f.type === "computed") continue;
    switch (f.key) {
      case "projectName":
        values[f.key] = str("projectName") || client.projectName || "";
        break;
      case "unitNo":
      case "flatNumber":
        values[f.key] = str("unitNo") || str("flatNumber") || client.unit || "";
        break;
      case "tower":
        values[f.key] = str("tower") || client.tower || "";
        break;
      case "amount": {
        const total = parseFloat(str("totalAmount"));
        values[f.key] = !Number.isNaN(total) && total > 0 ? String(Math.round(total * 0.1)) : "";
        break;
      }
      case "paidAt":
        values[f.key] = new Date().toISOString().slice(0, 10);
        break;
      case "mode":
        values[f.key] = f.options?.[0] ?? "Bank transfer";
        break;
      default:
        values[f.key] = "";
    }
  }
  return values;
}
