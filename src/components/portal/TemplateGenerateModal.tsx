"use client";

import { useEffect, useState } from "react";
import {
  TEMPLATE_CATEGORY_LABELS,
  type TemplateCategory,
  type TemplateFieldDef,
} from "@/lib/document-templates";
import { buildClientPrefill, buildReceiptPrefill } from "@/lib/template-calculations";
import { TemplateFormFields } from "./TemplateFormFields";

type TemplateRow = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  category: string;
};

interface TemplateGenerateModalProps {
  open: boolean;
  clientId: string;
  category: TemplateCategory;
  onClose: () => void;
  onGenerated: (downloadUrl: string) => void;
}

const SUBMIT_PATH: Record<TemplateCategory, string> = {
  cost_breakup: "price-breakup",
  payment_receipt: "advance-receipt",
};

export function TemplateGenerateModal({
  open,
  clientId,
  category,
  onClose,
  onGenerated,
}: TemplateGenerateModalProps) {
  const [step, setStep] = useState<"pick" | "fill">("pick");
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [fields, setFields] = useState<TemplateFieldDef[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setStep("pick");
    setSelectedId("");
    setError("");
    void fetch(`/api/templates?category=${category}`)
      .then((r) => r.json())
      .then((d) => setTemplates(d.templates ?? []));
  }, [open, category]);

  if (!open) return null;

  async function selectTemplate(id: string) {
    setLoading(true);
    setError("");
    const [tplRes, clientRes] = await Promise.all([
      fetch(`/api/templates/${id}`),
      fetch(`/api/clients/${clientId}`),
    ]);
    setLoading(false);
    if (!tplRes.ok) {
      setError("Could not load template");
      return;
    }
    const tplData = await tplRes.json();
    const clientData = clientRes.ok ? await clientRes.json() : { client: null };
    const c = clientData.client ?? { name: "" };
    const fieldList = tplData.fields ?? [];
    setSelectedId(id);
    setTemplateName(tplData.template.name);
    setFields(fieldList);

    if (category === "payment_receipt") {
      let priceBreakup: Record<string, string | number> | null = null;
      try {
        const wd = c.workflowData ? JSON.parse(c.workflowData) : {};
        priceBreakup = wd.priceBreakup ?? null;
      } catch {
        priceBreakup = null;
      }
      setValues(buildReceiptPrefill(fieldList, c, priceBreakup));
    } else {
      setValues(buildClientPrefill(fieldList, c));
    }
    setStep("fill");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch(
      `/api/clients/${clientId}/workflow/${SUBMIT_PATH[category]}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: selectedId, values }),
      }
    );
    setLoading(false);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to generate PDF");
      return;
    }
    onGenerated(data.downloadUrl);
    onClose();
  }

  const categoryLabel = TEMPLATE_CATEGORY_LABELS[category].toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--brand)]">
            {step === "pick" ? "Choose template" : templateName}
          </h2>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-800">
            ✕
          </button>
        </div>

        {step === "pick" && (
          <div className="space-y-3">
            <p className="text-sm text-[var(--muted)]">
              Select a {categoryLabel} template. Manage templates from the left menu.
            </p>
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                className="w-full rounded-lg border border-slate-200 p-4 text-left hover:border-teal-400 hover:bg-teal-50/50"
                disabled={loading}
                onClick={() => void selectTemplate(t.id)}
              >
                <p className="font-medium">
                  {t.name}
                  {t.isSystem && (
                    <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      Default
                    </span>
                  )}
                </p>
                {t.description && (
                  <p className="mt-1 text-sm text-[var(--muted)]">{t.description}</p>
                )}
              </button>
            ))}
            {templates.length === 0 && (
              <p className="text-sm text-[var(--muted)]">No templates available.</p>
            )}
          </div>
        )}

        {step === "fill" && (
          <>
            <button
              type="button"
              className="mb-4 text-sm text-teal-700 hover:underline"
              onClick={() => setStep("pick")}
            >
              ← Change template
            </button>
            <p className="mb-4 text-sm text-[var(--muted)]">
              {category === "cost_breakup"
                ? "GST/IGST and total auto-calculate when you enter base cost and tax %."
                : "Amount is pre-filled as 10% of total from price breakup when available."}
            </p>
            <form onSubmit={submit} className="space-y-3">
              <TemplateFormFields fields={fields} values={values} onChange={setValues} />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={loading}>
                  {loading ? "Generating PDF…" : "Generate & download PDF"}
                </button>
                <button type="button" className="btn-secondary" onClick={onClose}>
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
