"use client";

import { useEffect, useState } from "react";
import type { PriceBreakupFieldDef } from "@/lib/price-breakup-fields";

interface PriceBreakupModalProps {
  open: boolean;
  clientId: string;
  onClose: () => void;
  onGenerated: (downloadUrl: string) => void;
}

export function PriceBreakupModal({
  open,
  clientId,
  onClose,
  onGenerated,
}: PriceBreakupModalProps) {
  const [fields, setFields] = useState<PriceBreakupFieldDef[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    void Promise.all([
      fetch("/api/settings/price-breakup-fields").then((r) => r.json()),
      fetch(`/api/clients/${clientId}`).then((r) => r.json()),
    ]).then(([settings, clientRes]) => {
      const fieldList = settings.fields ?? [];
      setFields(fieldList);
      const c = clientRes.client;
      const defaults: Record<string, string> = {};
      for (const f of fieldList) {
        if (f.key === "projectName") {
          defaults[f.key] = c?.projectName ?? c?.preferredUnit?.project?.name ?? "";
        } else if (f.key === "flatNumber") {
          defaults[f.key] = c?.unit ?? c?.preferredUnit?.unitNumber ?? "";
        } else if (f.key === "tower") {
          defaults[f.key] = c?.tower ?? c?.preferredUnit?.block ?? "";
        } else if (f.key === "carpetAreaSqft" || f.key === "builtUpSqft") {
          if (c?.preferredUnit?.areaSqft) {
            defaults[f.key] = String(c.preferredUnit.areaSqft);
          } else {
            defaults[f.key] = "";
          }
        } else if (f.type === "select" && f.options?.[0]) {
          defaults[f.key] = f.options[0];
        } else {
          defaults[f.key] = "";
        }
      }
      setValues(defaults);
    });
  }, [open, clientId]);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch(`/api/clients/${clientId}/workflow/price-breakup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values }),
    });
    setLoading(false);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to generate PDF");
      return;
    }
    onGenerated(data.downloadUrl);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--brand)]">Price breakup letter</h2>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-800">
            ✕
          </button>
        </div>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Fill cost details. A PDF will be generated and saved to this client&apos;s documents.
        </p>
        <form onSubmit={submit} className="space-y-3">
          {fields.map((f) => (
            <label key={f.key} className="block text-sm">
              <span className="mb-1 block font-medium">
                {f.label}
                {f.required ? " *" : ""}
              </span>
              {f.type === "select" ? (
                <select
                  className="input"
                  value={values[f.key] ?? ""}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [f.key]: e.target.value }))
                  }
                  required={f.required}
                >
                  {(f.options ?? []).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="input"
                  type={f.type === "number" ? "number" : "text"}
                  step={f.type === "number" ? "any" : undefined}
                  value={values[f.key] ?? ""}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [f.key]: e.target.value }))
                  }
                  required={f.required}
                  placeholder={f.placeholder}
                />
              )}
            </label>
          ))}
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
      </div>
    </div>
  );
}
