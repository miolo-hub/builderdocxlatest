import fs from "fs";
import path from "path";
import { INITIAL_DATA } from "./seed";
import type { AuditEntry, DataStore, DocumentRecord } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

function ensureDataFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_DATA, null, 2));
  }
}

export function readStore(): DataStore {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw) as DataStore;
}

export function writeStore(data: DataStore): void {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function addAudit(entry: Omit<AuditEntry, "id" | "createdAt">): AuditEntry {
  const store = readStore();
  const full: AuditEntry = {
    ...entry,
    id: generateId("aud"),
    createdAt: new Date().toISOString(),
  };
  store.audit.unshift(full);
  writeStore(store);
  return full;
}

export function addDocument(doc: DocumentRecord): void {
  const store = readStore();
  store.documents.push(doc);
  writeStore(store);
}
