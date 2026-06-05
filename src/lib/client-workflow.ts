export const WORKFLOW_STEPS = [
  { id: "prospect", label: "Prospect", order: 1 },
  { id: "price_breakup_done", label: "Price breakup letter", order: 2 },
  { id: "advance_paid", label: "Paid advance", order: 3 },
  { id: "awaiting_decision", label: "Proceed or cancel", order: 4 },
  { id: "payment_path", label: "Loan or direct payment", order: 5 },
  { id: "loan_disbursement", label: "Bank loan disbursement", order: 6 },
  { id: "closed", label: "Complete", order: 7 },
] as const;

export type WorkflowStepId = (typeof WORKFLOW_STEPS)[number]["id"];

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

export function workflowStepLabel(
  step: (typeof WORKFLOW_STEPS)[number],
  data: ClientWorkflowData
): string {
  if (step.id === "closed" && data.decision === "cancelled") {
    return "Advance refund";
  }
  return step.label;
}

export function workflowStepsForClient(data: ClientWorkflowData) {
  if (data.decision === "cancelled") {
    return WORKFLOW_STEPS.filter(
      (s) => s.id !== "payment_path" && s.id !== "loan_disbursement"
    );
  }
  if (data.decision !== "proceed") {
    return WORKFLOW_STEPS.filter(
      (s) =>
        s.id !== "payment_path" &&
        s.id !== "loan_disbursement" &&
        s.id !== "closed"
    );
  }
  if (data.paymentPath === "direct") {
    return WORKFLOW_STEPS.filter((s) => s.id !== "loan_disbursement");
  }
  if (!data.paymentPath) {
    return WORKFLOW_STEPS.filter(
      (s) => s.id !== "loan_disbursement" && s.id !== "closed"
    );
  }
  return WORKFLOW_STEPS;
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
  if (stepId === "payment_path") return !!data.paymentPath;
  if (stepId === "closed") {
    if (data.decision === "cancelled") {
      return data.advanceRefunded !== undefined && data.advanceRefunded !== null;
    }
    if (data.paymentPath === "direct") return true;
    if (data.paymentPath === "loan") return !!data.loanTrackingComplete;
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
  if (data.decision === "cancelled") return "closed";
  if (!data.paymentPath) return "payment_path";
  if (data.paymentPath === "loan" && !data.loanTrackingComplete) {
    return "loan_disbursement";
  }
  return "closed";
}
