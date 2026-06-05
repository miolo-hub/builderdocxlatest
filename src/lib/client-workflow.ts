export const WORKFLOW_STEPS = [
  { id: "prospect", label: "Prospect", order: 1 },
  { id: "price_breakup_done", label: "Price breakup letter", order: 2 },
  { id: "advance_paid", label: "Paid advance", order: 3 },
  { id: "awaiting_decision", label: "Proceed or cancel", order: 4 },
  { id: "closed", label: "Outcome", order: 5 },
  { id: "loan_disbursement", label: "Bank loan disbursement", order: 6 },
] as const;

export type WorkflowStepId = (typeof WORKFLOW_STEPS)[number]["id"] | "closed";

export type LoanDisbursementEntry = {
  id: string;
  status: "requested" | "received";
  amount: number;
  bankName?: string;
  reference?: string;
  notes?: string;
  requestedAt: string;
  receivedAt?: string;
  transactionId?: string;
};

export type ClientWorkflowData = {
  priceBreakup?: Record<string, string | number> & {
    documentId?: string;
    templateId?: string;
    templateName?: string;
  };
  advance?: {
    amount: number;
    mode: string;
    reference?: string;
    paidAt: string;
    documentId?: string;
    templateId?: string;
    templateName?: string;
  };
  decision?: "proceed" | "cancelled";
  advanceRefunded?: boolean | null;
  paymentPath?: "loan" | "direct";
  loanDisbursements?: LoanDisbursementEntry[];
  loanTrackingComplete?: boolean;
};

export function parseWorkflowData(raw: string | null | undefined): ClientWorkflowData {
  if (!raw?.trim()) return {};
  try {
    return JSON.parse(raw) as ClientWorkflowData;
  } catch {
    return {};
  }
}

export function loanDisbursementsReceived(data: ClientWorkflowData): number {
  return (data.loanDisbursements ?? [])
    .filter((d) => d.status === "received")
    .reduce((s, d) => s + d.amount, 0);
}

export function workflowStepsForClient(data: ClientWorkflowData) {
  if (data.paymentPath === "loan") return WORKFLOW_STEPS;
  return WORKFLOW_STEPS.filter((s) => s.id !== "loan_disbursement");
}

export function workflowStepIndex(step: string): number {
  const idx = WORKFLOW_STEPS.findIndex((s) => s.id === step);
  if (step === "closed") return WORKFLOW_STEPS.length;
  return idx >= 0 ? idx : 0;
}

export function isStepComplete(
  stepId: string,
  currentStep: string,
  data: ClientWorkflowData
): boolean {
  if (stepId === "prospect") return !!data.priceBreakup?.documentId;
  if (stepId === "price_breakup_done") return !!data.advance?.documentId;
  if (stepId === "advance_paid") return !!data.advance?.documentId;
  if (stepId === "awaiting_decision") return !!data.decision;
  if (stepId === "closed") {
    if (data.decision === "cancelled") {
      return data.advanceRefunded !== undefined && data.advanceRefunded !== null;
    }
    if (data.decision === "proceed") return !!data.paymentPath;
    return false;
  }
  if (stepId === "loan_disbursement") {
    if (data.paymentPath !== "loan") return true;
    return !!data.loanTrackingComplete;
  }
  return false;
}

export function getActiveWorkflowStep(
  workflowStep: string,
  data: ClientWorkflowData
): string {
  if (!data.priceBreakup?.documentId) return "prospect";
  if (!data.advance?.documentId) return "price_breakup_done";
  if (!data.decision) return "awaiting_decision";
  if (data.decision === "cancelled") {
    if (data.advanceRefunded === undefined || data.advanceRefunded === null) {
      return "awaiting_decision";
    }
    return "closed";
  }
  if (data.decision === "proceed" && !data.paymentPath) return "awaiting_decision";
  if (data.paymentPath === "loan" && !data.loanTrackingComplete) {
    return "loan_disbursement";
  }
  if (data.decision === "proceed" && data.paymentPath === "direct") return "closed";
  if (data.paymentPath === "loan" && data.loanTrackingComplete) return "closed";
  return workflowStep;
}
