import fs from "fs";
import path from "path";
import { INITIAL_DATA } from "./seed";
import type { AuditEntry, DataStore, DocumentRecord } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

function defaultStore(): DataStore {
  return JSON.parse(JSON.stringify(INITIAL_DATA)) as DataStore;
}

function tryWriteStore(data: DataStore): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.warn("Could not write store.json:", e);
  }
}

export function readStore(): DataStore {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const data = defaultStore();
      tryWriteStore(data);
      return data;
    }
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const data = JSON.parse(raw) as DataStore;
    if (!data.builders?.length) data.builders = [...INITIAL_DATA.builders];
    if (!data.users?.length) data.users = [...INITIAL_DATA.users];
    if (!data.documents) data.documents = [];
    if (!data.audit) data.audit = [];
    if (!data.customers) data.customers = [];
    return data;
  } catch (e) {
    console.warn("readStore fallback to defaults:", e);
    return defaultStore();
  }
}

export function writeStore(data: DataStore): void {
  tryWriteStore(data);
}

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function addAudit(entry: Omit<AuditEntry, "id" | "createdAt">): AuditEntry {
  const full: AuditEntry = {
    ...entry,
    id: generateId("aud"),
    createdAt: new Date().toISOString(),
  };
  try {
    const store = readStore();
    store.audit.unshift(full);
    writeStore(store);
  } catch (e) {
    console.warn("addAudit skipped:", e);
  }
  return full;
}

export function addDocument(doc: DocumentRecord): void {
  const store = readStore();
  store.documents.push(doc);
  writeStore(store);
}
