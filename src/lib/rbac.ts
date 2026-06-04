export type UserRole =
  | "super_admin"
  | "sales_agent"
  | "accounts"
  | "document_manager";

// Legacy role mapping from BuilderDocs
const LEGACY_ROLES: Record<string, UserRole> = {
  admin: "super_admin",
  sales: "sales_agent",
  document_manager: "document_manager",
};

export function normalizeRole(role: string): UserRole {
  return (LEGACY_ROLES[role] ?? role) as UserRole;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin / MD",
  sales_agent: "Sales Agent",
  accounts: "Accounts",
  document_manager: "Document Manager",
};

type Permission =
  | "projects.manage"
  | "units.manage"
  | "clients.manage"
  | "clients.update_stage"
  | "clients.view_all"
  | "deals.manage"
  | "payments.view"
  | "payments.record"
  | "documents.manage"
  | "agents.manage"
  | "commissions.view_all"
  | "reports.view"
  | "whatsapp.blast"
  | "users.manage";

const PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    "projects.manage",
    "units.manage",
    "clients.manage",
    "clients.view_all",
    "deals.manage",
    "payments.view",
    "payments.record",
    "documents.manage",
    "agents.manage",
    "commissions.view_all",
    "reports.view",
    "whatsapp.blast",
    "users.manage",
  ],
  sales_agent: [
    "projects.manage",
    "units.manage",
    "clients.manage",
    "clients.update_stage",
    "deals.manage",
    "payments.view",
    "documents.manage",
    "commissions.view_all",
  ],
  accounts: [
    "clients.view_all",
    "payments.view",
    "payments.record",
    "documents.manage",
    "commissions.view_all",
    "reports.view",
  ],
  document_manager: [
    "clients.view_all",
    "documents.manage",
  ],
};

export function can(role: string, permission: Permission): boolean {
  const r = normalizeRole(role);
  return PERMISSIONS[r]?.includes(permission) ?? false;
}
