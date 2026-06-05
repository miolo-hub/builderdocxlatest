"use client";

import { useState } from "react";
import {
  canSendWelcomeKit,
  getActiveWorkflowStep,
  isStepComplete,
  loanDisbursementsReceived,
  parseWorkflowData,
  workflowStepLabel,
  workflowStepsForClient,
} from "@/lib/client-workflow";
import { TemplateGenerateModal } from "./TemplateGenerateModal";

interface ClientWorkflowProps {
  clientId: string;
  clientName: string;
  clientEmail?: string | null;
  clientStage: string;
  hasDeal?: boolean;
  workflowStep: string;
  workflowDataRaw: string | null;
  canEdit: boolean;
  onUpdated: () => void;
}

export function ClientWorkflow({
  clientId,
  clientName,
  clientEmail,
  clientStage,
  hasDeal = false,
  workflowStep,
  workflowDataRaw,
  canEdit,
  onUpdated,
}: ClientWorkflowProps) {
  const data = parseWorkflowData(workflowDataRaw);
  const activeStep = getActiveWorkflowStep(workflowStep, data, {
    clientStage,
    hasDeal,
  });
  const welcomeUnlocked = canSendWelcomeKit(clientStage, hasDeal);
  const steps = workflowStepsForClient(data);
  const [showBreakup, setShowBreakup] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [loanModal, setLoanModal] = useState<"request" | "record" | null>(null);
  const [loanAmount, setLoanAmount] = useState("");
  const [loanBank, setLoanBank] = useState("");
  const [loanReference, setLoanReference] = useState("");
  const [loanNotes, setLoanNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loanReceived = loanDisbursementsReceived(data);
  const loanPending = (data.loanDisbursements ?? []).filter((d) => d.status === "requested");

  async function openDocDownload(documentId: string) {
    const res = await fetch(`/api/documents/${documentId}/download-url`);
    if (res.ok) {
      const { downloadUrl } = await res.json();
      window.open(downloadUrl, "_blank");
    }
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

  async function submitLoanDisbursement(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/clients/${clientId}/workflow/loan-disbursement`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: loanModal,
        amount: loanAmount,
        bankName: loanBank,
        reference: loanReference,
        notes: loanNotes,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Failed");
      return;
    }
    setLoanModal(null);
    setLoanAmount("");
    setLoanBank("");
    setLoanReference("");
    setLoanNotes("");
    onUpdated();
  }

  async function markRequestReceived(entryId: string, amount: number) {
    await workflowAction({
      action: "mark_disbursement_received",
      entryId,
      amount,
    });
  }

  async function sendWelcomeEmail() {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/clients/${clientId}/workflow/welcome-email`, {
      method: "POST",
    });
    setSaving(false);
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Failed to send welcome email");
      return;
    }
    onUpdated();
  }

  const welcomeSent = !!data.welcomeEmail?.sentAt;

  return (
    <div className="card p-6">
      <h3 className="mb-1 font-semibold text-[var(--brand)]">Client journey</h3>
      <p className="mb-6 text-sm text-[var(--muted)]">
        Prospect → price breakup → advance → proceed/cancel → loan or direct → bank disbursement →
        welcome email
      </p>

      <ol className="space-y-4">
        {steps.map((step) => {
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
                  done
                    ? "bg-teal-600 text-white"
                    : active
                      ? "bg-teal-100 text-teal-800"
                      : "bg-slate-100 text-slate-500"
                }`}
              >
                {done ? "✓" : step.order}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{workflowStepLabel(step, data)}</p>

                {step.id === "awaiting_decision" && data.decision && (
                  <p className="mt-1 text-sm text-teal-800">
                    {data.decision === "proceed" ? "Proceeding with booking" : "Booking cancelled"}
                  </p>
                )}

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
                        onClick={() => setShowReceipt(true)}
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
                    Download advance receipt (Rs.{" "}
                    {data.advance.amount.toLocaleString("en-IN")})
                  </button>
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
                      onClick={() =>
                        void workflowAction({ action: "decision", decision: "cancelled" })
                      }
                    >
                      Cancelled
                    </button>
                  </div>
                )}

                {step.id === "payment_path" &&
                  active &&
                  canEdit &&
                  data.decision === "proceed" &&
                  !data.paymentPath && (
                    <div className="mt-3">
                      <p className="mb-2 text-sm">How will the buyer pay the balance?</p>
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
                            void workflowAction({
                              action: "payment_path",
                              paymentPath: "direct",
                            })
                          }
                        >
                          Direct payment
                        </button>
                      </div>
                    </div>
                  )}

                {step.id === "payment_path" &&
                  done &&
                  data.decision === "proceed" &&
                  data.paymentPath && (
                    <p className="mt-2 text-sm text-teal-800">
                      {data.paymentPath === "loan"
                        ? "Proceeding via bank loan"
                        : "Proceeding with direct payment"}
                    </p>
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

                {step.id === "closed" &&
                  done &&
                  data.decision === "proceed" &&
                  data.paymentPath === "direct" && (
                    <p className="mt-2 text-sm text-teal-800">Journey complete — direct payment path</p>
                  )}

                {step.id === "closed" &&
                  done &&
                  data.paymentPath === "loan" &&
                  data.loanTrackingComplete && (
                    <p className="mt-2 text-sm text-teal-800">Journey complete — loan tracking finished</p>
                  )}

                {step.id === "loan_disbursement" && data.paymentPath === "loan" && (
                  <div className="mt-3 space-y-3 text-sm">
                    <p className="text-[var(--muted)]">
                      Track bank loan requests and amounts received. Recorded disbursements count
                      toward collected revenue on the dashboard.
                    </p>
                    {loanReceived > 0 && (
                      <p className="font-medium text-green-800">
                        Total received from bank: Rs. {loanReceived.toLocaleString("en-IN")}
                      </p>
                    )}
                    {(data.loanDisbursements ?? []).length > 0 && (
                      <ul className="space-y-2 rounded-lg bg-slate-50 p-3">
                        {(data.loanDisbursements ?? []).map((d) => (
                          <li key={d.id} className="flex flex-wrap items-center justify-between gap-2">
                            <span>
                              {d.status === "requested" ? "⏳ Requested" : "✓ Received"} —{" "}
                              {d.amount > 0
                                ? `Rs. ${d.amount.toLocaleString("en-IN")}`
                                : "Amount TBD"}
                              {d.bankName ? ` · ${d.bankName}` : ""}
                            </span>
                            {d.status === "requested" && canEdit && active && (
                              <button
                                type="button"
                                className="text-xs text-teal-700 hover:underline"
                                disabled={saving}
                                onClick={() => {
                                  const amt = prompt(
                                    "Amount received from bank (Rs.)",
                                    d.amount ? String(d.amount) : ""
                                  );
                                  if (amt && parseFloat(amt) > 0) {
                                    void markRequestReceived(d.id, parseFloat(amt));
                                  }
                                }}
                              >
                                Mark received
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    {loanPending.length > 0 && (
                      <p className="text-xs text-amber-700">
                        {loanPending.length} disbursement request(s) pending from bank
                      </p>
                    )}
                    {active && canEdit && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn-secondary text-sm"
                          onClick={() => setLoanModal("request")}
                        >
                          Request disbursement
                        </button>
                        <button
                          type="button"
                          className="btn-primary text-sm"
                          onClick={() => setLoanModal("record")}
                        >
                          Record amount received
                        </button>
                        {(data.loanDisbursements ?? []).length > 0 && (
                          <button
                            type="button"
                            className="btn-secondary text-sm"
                            disabled={saving}
                            onClick={() => void workflowAction({ action: "loan_complete" })}
                          >
                            Done tracking loan
                          </button>
                        )}
                      </div>
                    )}
                    {data.loanTrackingComplete && (
                      <p className="text-teal-800">Loan tracking completed</p>
                    )}
                  </div>
                )}

                {step.id === "welcome_kit" && (
                  <div className="mt-3 space-y-2 text-sm">
                    <p className="text-[var(--muted)]">
                      Send a welcome email with the project brochure attached (uploaded during
                      project onboarding).
                    </p>
                    {welcomeSent ? (
                      <p className="text-teal-800">
                        Sent to {data.welcomeEmail!.sentTo} on{" "}
                        {new Date(data.welcomeEmail!.sentAt).toLocaleString("en-IN")}
                        {data.welcomeEmail!.brochureAttached
                          ? " · Brochure attached"
                          : " · No brochure on file"}
                      </p>
                    ) : !welcomeUnlocked ? (
                      <p className="text-amber-800">
                        Book the flat first — use <strong>Book flat</strong> above or set client
                        status to <strong>Booked</strong> after linking a unit.
                      </p>
                    ) : canEdit ? (
                      !clientEmail?.trim() ? (
                        <p className="text-amber-800">
                          Add the client&apos;s email on their profile to send welcome mail.
                        </p>
                      ) : (
                        <button
                          type="button"
                          className="btn-primary text-sm"
                          disabled={saving}
                          onClick={() => void sendWelcomeEmail()}
                        >
                          {saving ? "Sending…" : "Send welcome email"}
                        </button>
                      )
                    ) : null}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <TemplateGenerateModal
        open={showBreakup}
        clientId={clientId}
        category="cost_breakup"
        onClose={() => setShowBreakup(false)}
        onGenerated={(url) => {
          window.open(url, "_blank");
          onUpdated();
        }}
      />

      <TemplateGenerateModal
        open={showReceipt}
        clientId={clientId}
        category="payment_receipt"
        onClose={() => setShowReceipt(false)}
        onGenerated={(url) => {
          window.open(url, "_blank");
          onUpdated();
        }}
      />

      {loanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-md p-6">
            <h2 className="mb-4 text-lg font-bold">
              {loanModal === "request"
                ? "Request bank disbursement"
                : "Record disbursement received"}
            </h2>
            <form onSubmit={submitLoanDisbursement} className="space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">
                  {loanModal === "request" ? "Expected amount (Rs.)" : "Amount received (Rs.) *"}
                </span>
                <input
                  className="input"
                  type="number"
                  min="0"
                  required={loanModal === "record"}
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Bank / lender</span>
                <input
                  className="input"
                  value={loanBank}
                  onChange={(e) => setLoanBank(e.target.value)}
                  placeholder="e.g. HDFC, SBI"
                />
              </label>
              {loanModal === "record" && (
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">Reference / UTR</span>
                  <input
                    className="input"
                    value={loanReference}
                    onChange={(e) => setLoanReference(e.target.value)}
                  />
                </label>
              )}
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Notes</span>
                <input
                  className="input"
                  value={loanNotes}
                  onChange={(e) => setLoanNotes(e.target.value)}
                />
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? "Saving…" : loanModal === "request" ? "Submit request" : "Save & count in revenue"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setLoanModal(null)}
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
