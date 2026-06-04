import type { Prisma } from "@/generated/prisma/client";
import * as XLSX from "xlsx";
import { formatUnitNumber } from "./inventory-layout";
import { generateId } from "./store";

export { generateTowerLayoutUnits, formatUnitNumber } from "./inventory-layout";

export const UNIT_STATUSES = [
  "available",
  "reserved",
  "sold",
  "blocked",
  "cancelled",
] as const;

export type UnitStatus = (typeof UNIT_STATUSES)[number];

export interface UnitSeed {
  unitNumber: string;
  tower: string;
  floor: string;
  block: string;
  status: UnitStatus;
  basePrice: number;
}

export const INVENTORY_TEMPLATE_HEADERS = [
  "tower",
  "floor",
  "flat",
  "unit_number",
  "block",
  "status",
  "base_price",
] as const;

export const INVENTORY_TEMPLATE_CSV = `${INVENTORY_TEMPLATE_HEADERS.join(",")}
A,1,1,A101,Tower A,available,8500000
A,1,2,A102,Tower A,available,8500000
A,1,3,A103,Tower A,blocked,8500000
B,1,1,B101,Tower B,sold,9200000
B,1,2,B102,Tower B,reserved,9200000`;

function normalizeStatus(raw: string): UnitStatus {
  const s = raw.toLowerCase().trim().replace(/\s+/g, "_");
  const map: Record<string, UnitStatus> = {
    available: "available",
    avail: "available",
    reserved: "reserved",
    reserve: "reserved",
    sold: "sold",
    blocked: "blocked",
    block: "blocked",
    cancelled: "cancelled",
    canceled: "cancelled",
  };
  const status = map[s];
  if (!status) throw new Error(`Invalid status "${raw}"`);
  return status;
}

function cell(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const v = row[key];
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      return String(v).trim();
    }
  }
  return "";
}

function num(row: Record<string, unknown>, ...keys: string[]): number {
  const s = cell(row, ...keys);
  if (!s) return 0;
  const n = parseFloat(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function parseInventorySpreadsheet(buffer: Buffer): UnitSeed[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error("Spreadsheet is empty");

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });

  if (rows.length === 0) throw new Error("No data rows found");

  const units: UnitSeed[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const normalized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(raw)) {
      normalized[k.toLowerCase().replace(/\s+/g, "_")] = v;
    }

    const tower = cell(normalized, "tower", "block_code", "wing").toUpperCase();
    const floor = cell(normalized, "floor", "floor_no", "level");
    const flat = cell(normalized, "flat", "flat_no", "unit_on_floor", "seq");
    let unitNumber = cell(normalized, "unit_number", "unit", "unit_no");

    if (!unitNumber && tower && floor && flat) {
      const f = parseInt(floor, 10);
      const fl = parseInt(flat, 10);
      if (!Number.isFinite(f) || !Number.isFinite(fl)) {
        throw new Error(`Row ${i + 2}: invalid floor or flat`);
      }
      unitNumber = formatUnitNumber(tower, f, fl);
    }

    if (!unitNumber) {
      throw new Error(`Row ${i + 2}: missing unit_number or tower/floor/flat`);
    }

    const statusRaw = cell(normalized, "status", "unit_status");
    if (!statusRaw) throw new Error(`Row ${i + 2}: missing status`);

    const status = normalizeStatus(statusRaw);
    const basePrice = num(normalized, "base_price", "price", "baseprice") || 1;
    const block = cell(normalized, "block", "tower_name") || (tower ? `Tower ${tower}` : "");

    if (seen.has(unitNumber)) {
      throw new Error(`Duplicate unit number: ${unitNumber}`);
    }
    seen.add(unitNumber);

    units.push({
      unitNumber,
      tower: tower || unitNumber.charAt(0),
      floor: floor || "",
      block,
      status,
      basePrice,
    });
  }

  return units;
}

export async function bulkCreateUnits(
  tx: Prisma.TransactionClient,
  projectId: string,
  units: UnitSeed[]
) {
  for (const u of units) {
    await tx.unit.create({
      data: {
        id: generateId("unit"),
        projectId,
        unitNumber: u.unitNumber,
        type: "apartment",
        floor: u.floor || null,
        block: u.block || null,
        basePrice: u.basePrice,
        status: u.status,
      },
    });
  }
}
