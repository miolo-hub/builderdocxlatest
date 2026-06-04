import type { DocumentType } from "./types";

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  sale_agreement: "Sale Agreement",
  price_breakup: "Price Breakup Letter",
  allotment_letter: "Allotment Letter",
  payment_receipt: "Payment Receipt",
  noc: "NOC",
  possession_letter: "Possession Letter",
  title_deed: "Title Deed",
  brochure: "Brochure / Floor Plan",
  bank_sanction: "Bank Loan Sanction",
  booking_form: "Booking Form",
  construction_photo: "Construction Photo",
  other: "Other",
};

export const CLIENT_STAGE_LABELS: Record<string, string> = {
  prospect: "Prospect",
  interested: "Interested",
  negotiating: "Negotiating",
  booked: "Booked",
  active_buyer: "Active buyer",
  completed: "Completed",
};

export const CLIENT_STAGES = Object.keys(CLIENT_STAGE_LABELS);

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  pre_launch: "Pre-launch",
  active: "Active",
  completed: "Completed",
  handover: "Handover",
};

export const PROJECT_STATUSES = Object.keys(PROJECT_STATUS_LABELS);

export const PROJECT_TYPES = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "plots", label: "Plots" },
  { value: "villas", label: "Villas" },
] as const;

