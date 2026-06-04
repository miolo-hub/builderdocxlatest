"use client";

import { useState } from "react";
import {
  WORKFLOW_STEPS,
  getActiveWorkflowStep,
  isStepComplete,
  parseWorkflowData,
  type ClientWorkflowData,
} from "@/lib/client-workflow";
import { PriceBreakupModal } from "./PriceBreakupModal";

interface ClientWorkflowProps {
  clientId: string;
  clientName: string;
  workflowStep: string;
  workflowDataRaw: string | null;
  canEdit: boolean;
  onUpdated: () => void;
}

export function ClientWorkflow({
  clientId,
  clientName,
  workflowStep,
  workflowDataRaw,
  canEdit,
  onUpdated,
}: ClientWorkflowProps) {
  const data = parseWorkflowData(workflowDataRaw);
  const activeStep = getActiveWorkflowStep(workflowStep, data);
  const [showBreakup, setShowBreakup] = useState(false);
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("bank_transfer");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function openDocDownload(documentId: string) {
    const res = await fetch(`/api/documents/${documentId}/download-url`);
    if (res.ok) {
      const { downloadUrl } = await res.json();
      window.open(downloadUrl, "_blank");
    }
  }

  async function recordAdvance(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/clients/${clientId}/workflow/advance-receipt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, mode, reference }),
    });
    setSaving(false);
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Failed");
      return;
    }
    setAdvanceOpen(false);
    window.open(json.downloadUrl, "_blank");
    onUpdated();
  }

  async function workflowAction(body: Record<string, unknown>) {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/clients/${clientId}/workflow`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Failed");
      return;
    }
    onUpdated();
  }

  return (
    <div className="card p-6">
      <h3 className="mb-1 font-semibold text-[var(--brand)]">Client journey</h3>
      <p className="mb-6 text-sm text-[var(--muted)]">
        Prospect → price breakup → advance → proceed or cancel → loan or direct
      </p>

      <ol className="space-y-4">
        {WORKFLOW_STEPS.map((step) => {
          const done = isStepComplete(step.id, workflowStep, data);
          const active = activeStep === step.id;
          return (
            <li
              key={step.id}
              className={`flex gap-4 rounded-lg border p-4 ${
                active ? "border-teal-300 bg-teal-50/50" : "border-slate-100"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  done ? "bg-teal-600 text-white" : active ? "bg-teal-100 text-teal-800" : "bg-slate-100 text-slate-500"
                }`}
              >
                {done ? "✓" : step.order}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{step.label}</p>
                {step.id === "prospect" && active && canEdit && (
                  <button
                    type="button"
                    className="btn-primary mt-2 text-sm"
                    onClick={() => setShowBreakup(true)}
                  >
                    Generate price breakup letter
                  </button>
                )}
                {step.id === "price_breakup_done" && (
                  <div className="mt-2 space-y-2 text-sm">
                    {data.priceBreakup?.documentId && (
                      <button
                        type="button"
                        className="text-teal-700 hover:underline"
                        onClick={() => void openDocDownload(data.priceBreakup!.documentId!)}
                      >
                        Download price breakup PDF
                      </button>
                    )}
                    {active && canEdit && !data.advance?.documentId && (
                      <button
                        type="button"
                        className="btn-primary text-sm"
                        onClick={() => setAdvanceOpen(true)}
                      >
                        Record paid advance & receipt
                      </button>
                    )}
                  </div>
                )}
                {step.id === "advance_paid" && data.advance?.documentId && (
                  <button
                    type="button"
                    className="mt-2 text-sm text-teal-700 hover:underline"
                    onClick={() => void openDocDownload(data.advance!.documentId!)}
                  >
                    Download advance receipt (₹{data.advance.amount.toLocaleString("en-IN")})
                  </button>
                )}
                {step.id === "awaiting_decision" &&
                  data.advance?.documentId &&
                  !data.decision &&
                  canEdit && (
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Advance recorded. Choose next step below.
                  </p>
                )}
                {step.id === "awaiting_decision" && active && canEdit && !data.decision && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn-primary text-sm"
                      disabled={saving}
                      onClick={() => void workflowAction({ action: "decision", decision: "proceed" })}
                    >
                      Proceed
                    </button>
                    <button
                      type="button"
                      className="btn-secondary text-sm"
                      disabled={saving}
                      onClick={() => void workflowAction({ action: "decision", decision: "cancelled" })}
                    >
                      Cancelled
                    </button>
                  </div>
                )}
                {step.id === "closed" && active && canEdit && data.decision === "cancelled" && (
                  <div className="mt-3">
                    <p className="mb-2 text-sm">Advance returned to client?</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn-primary text-sm"
                        disabled={saving}
                        onClick={() =>
                          void workflowAction({ action: "advance_refund", refunded: true })
                        }
                      >
                        Yes, refunded
                      </button>
                      <button
                        type="button"
                        className="btn-secondary text-sm"
                        disabled={saving}
                        onClick={() =>
                          void workflowAction({ action: "advance_refund", refunded: false })
                        }
                      >
                        No
                      </button>
                    </div>
                  </div>
                )}
                {step.id === "closed" && active && canEdit && data.decision === "proceed" && !data.paymentPath && (
                  <div className="mt-3">
                    <p className="mb-2 text-sm">How will the buyer pay?</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn-primary text-sm"
                        disabled={saving}
                        onClick={() =>
                          void workflowAction({ action: "payment_path", paymentPath: "loan" })
                        }
                      >
                        Via bank loan
                      </button>
                      <button
                        type="button"
                        className="btn-secondary text-sm"
                        disabled={saving}
                        onClick={() =>
                          void workflowAction({ action: "payment_path", paymentPath: "direct" })
                        }
                      >
                        Direct payment
                      </button>
                    </div>
                  </div>
                )}
                {step.id === "closed" && done && (
                  <p className="mt-2 text-sm text-teal-800">
                    {data.decision === "cancelled"
                      ? data.advanceRefunded
                        ? "Cancelled — advance refunded"
                        : "Cancelled — advance not refunded"
                      : data.paymentPath === "loan"
                        ? "Proceeding via bank loan"
                        : "Proceeding with direct payment"}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <PriceBreakupModal
        open={showBreakup}
        clientId={clientId}
        onClose={() => setShowBreakup(false)}
        onGenerated={(url) => {
          window.open(url, "_blank");
          onUpdated();
        }}
      />

      {advanceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-md p-6">
            <h2 className="mb-4 text-lg font-bold">Paid advance — {clientName}</h2>
            <form onSubmit={recordAdvance} className="space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Amount (₹) *</span>
                <input
                  className="input"
                  type="number"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Payment mode</span>
                <select className="input" value={mode} onChange={(e) => setMode(e.target.value)}>
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Reference / UTR</span>
                <input
                  className="input"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? "Saving…" : "Create receipt PDF"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setAdvanceOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
