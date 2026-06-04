export type UserRole = "admin" | "sales" | "document_manager";

export type DocumentType =
  | "sale_agreement"
  | "price_breakup"
  | "allotment_letter"
  | "payment_receipt"
  | "noc"
  | "possession_letter"
  | "other";

export type DocumentVisibility = "internal" | "customer";

export interface Builder {
  id: string;
  name: string;
  slug: string;
}

export interface PortalUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  builderId: string;
}

export interface Customer {
  id: string;
  builderId: string;
  name: string;
  phone: string;
  email?: string;
  unit: string;
  tower: string;
  project: string;
}

export interface DocumentRecord {
  id: string;
  customerId: string;
  builderId: string;
  type: DocumentType;
  title: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  visibility: DocumentVisibility;
  documentDate: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface AuditEntry {
  id: string;
  builderId: string;
  action: string;
  actor: string;
  actorType: "portal_user" | "customer" | "system";
  customerId?: string;
  documentId?: string;
  metadata?: Record<string, string>;
  createdAt: string;
}

export interface DataStore {
  builders: Builder[];
  users: PortalUser[];
  customers: Customer[];
  documents: DocumentRecord[];
  audit: AuditEntry[];
}

export interface BotSession {
  phone: string;
  customerId: string | null;
  verified: boolean;
  otp: string | null;
  otpExpiresAt: number | null;
  step: BotStep;
  pendingDocType: DocumentType | null;
}

export type BotStep =
  | "welcome"
  | "menu"
  | "awaiting_otp"
  | "documents_list"
  | "payment_status"
  | "team_handoff";
