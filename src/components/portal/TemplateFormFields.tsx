"use client";

import type { TemplateFieldDef } from "@/lib/document-templates";
import { applyTemplateCalculations } from "@/lib/template-calculations";

interface TemplateFormFieldsProps {
  fields: TemplateFieldDef[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}

export function TemplateFormFields({ fields, values, onChange }: TemplateFormFieldsProps) {
  function update(key: string, val: string) {
    const next = applyTemplateCalculations(fields, { ...values, [key]: val });
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {fields.map((f) => {
        if (f.type === "section") {
          return (
            <h4
              key={f.key}
              className="border-b border-slate-200 pt-2 text-sm font-semibold text-[var(--brand)]"
            >
              {f.label}
            </h4>
          );
        }

        const isComputed = f.type === "computed" || f.readOnly;
        const val = values[f.key] ?? "";

        return (
          <label key={f.key} className="block text-sm">
            <span className="mb-1 block font-medium">
              {f.label}
              {f.required && !isComputed ? " *" : ""}
            </span>
            {f.type === "select" ? (
              <select
                className="input"
                value={val}
                disabled={isComputed}
                onChange={(e) => update(f.key, e.target.value)}
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
                className={`input ${isComputed ? "bg-slate-50 font-medium text-teal-900" : ""}`}
                type={f.type === "number" || f.type === "computed" ? "number" : "text"}
                step="any"
                value={val}
                readOnly={isComputed}
                onChange={(e) => update(f.key, e.target.value)}
                required={f.required && !isComputed}
                placeholder={f.placeholder}
              />
            )}
          </label>
        );
      })}
    </div>
  );
}
