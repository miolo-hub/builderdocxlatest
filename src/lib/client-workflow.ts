export const WORKFLOW_STEPS = [
  { id: "prospect", label: "Prospect", order: 1 },
  { id: "price_breakup_done", label: "Price breakup letter", order: 2 },
  { id: "advance_paid", label: "Paid advance", order: 3 },
  { id: "awaiting_decision", label: "Proceed or cancel", order: 4 },
  { id: "closed", label: "Outcome", order: 5 },
] as const;

export type WorkflowStepId = (typeof WORKFLOW_STEPS)[number]["id"] | "closed";

export type ClientWorkflowData = {
  priceBreakup?: Record<string, string | number> & { documentId?: string };
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
};

export function parseWorkflowData(raw: string | null | undefined): ClientWorkflowData {
  if (!raw?.trim()) return {};
  try {
    return JSON.parse(raw) as ClientWorkflowData;
  } catch {
    return {};
  }
}

export function workflowStepIndex(step: string): number {
  const idx = WORKFLOW_STEPS.findIndex((s) => s.id === step);
  if (step === "closed") return WORKFLOW_STEPS.length;
  return idx >= 0 ? idx : 0;
}

export function isStepComplete(stepId: string, currentStep: string, data: ClientWorkflowData): boolean {
  const currentIdx = workflowStepIndex(currentStep);
  const stepIdx = workflowStepIndex(stepId);
  if (stepIdx < currentIdx) return true;
  if (stepId === "prospect") return currentIdx > 0 || !!data.priceBreakup?.documentId;
  if (stepId === "price_breakup_done") return !!data.priceBreakup?.documentId;
  if (stepId === "advance_paid") return !!data.advance?.documentId;
  if (stepId === "awaiting_decision") return !!data.decision;
  if (stepId === "closed") {
    return (
      data.decision === "cancelled" &&
      data.advanceRefunded !== undefined &&
      data.advanceRefunded !== null
    ) || (data.decision === "proceed" && !!data.paymentPath);
  }
  return false;
}

export function getActiveWorkflowStep(
  workflowStep: string,
  data: ClientWorkflowData
): string {
  if (workflowStep === "closed") return "closed";
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
  if (data.decision === "proceed" && data.paymentPath) return "closed";
  return workflowStep;
}
