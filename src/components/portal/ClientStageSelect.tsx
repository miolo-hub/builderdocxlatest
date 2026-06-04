"use client";

import { useEffect, useState } from "react";
import { CLIENT_STAGE_LABELS, CLIENT_STAGES } from "@/lib/constants";

interface ClientStageSelectProps {
  clientId: string;
  stage: string;
  linkedUnitId?: string | null;
  canEdit: boolean;
  onUpdated: () => void;
  compact?: boolean;
}

export function ClientStageSelect({
  clientId,
  stage,
  linkedUnitId,
  canEdit,
  onUpdated,
  compact,
}: ClientStageSelectProps) {
  const [value, setValue] = useState(stage);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setValue(stage);
  }, [stage]);

  const badgeClass =
    stage === "cancelled"
      ? "bg-slate-200 text-slate-700"
      : "bg-teal-50 text-teal-800";

  if (!canEdit) {
    return (
      <span className={`badge ${badgeClass} ${compact ? "text-xs" : ""}`}>
        {CLIENT_STAGE_LABELS[stage] ?? stage}
      </span>
    );
  }

  async function save(next: string) {
    if (next === stage) return;
    setSaving(true);
    setError("");
    const res = await fetch(`/api/clients/${clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stage: next,
        ...(linkedUnitId ? { unitId: linkedUnitId } : {}),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Could not update status");
      setValue(stage);
      return;
    }
    setValue(next);
    onUpdated();
  }

  return (
    <div className={compact ? "inline-flex flex-col items-end gap-1" : "flex flex-col gap-1"}>
      <select
        className={`input ${compact ? "max-w-[11rem] py-1 text-xs" : "max-w-xs"}`}
        value={value}
        disabled={saving}
        onChange={(e) => {
          const next = e.target.value;
          setValue(next);
          void save(next);
        }}
      >
        {CLIENT_STAGES.map((s) => (
          <option key={s} value={s}>
            {CLIENT_STAGE_LABELS[s]}
          </option>
        ))}
      </select>
      {saving && <span className="text-xs text-[var(--muted)]">Saving…</span>}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
