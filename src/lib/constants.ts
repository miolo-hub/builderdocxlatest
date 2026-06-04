import type { DocumentType } from "./types";

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  sale_agreement: "Sale Agreement",
  price_breakup: "Price Breakup Letter",
  allotment_letter: "Allotment Letter",
  payment_receipt: "Payment Receipt",
  noc: "NOC",
  possession_letter: "Possession Letter",
  other: "Other",
};

export const ROLE_LABELS = {
  admin: "Administrator",
  sales: "Sales Executive",
  document_manager: "Document Manager",
} as const;

export const DEMO_OTP = "482916";
