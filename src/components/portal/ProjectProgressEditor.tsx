"use client";

import { useEffect, useState } from "react";
import { PROJECT_STATUS_LABELS, PROJECT_STATUSES } from "@/lib/constants";

interface ProjectProgressEditorProps {
  projectId: string;
  status: string;
  constructionPct: number;
  canEdit: boolean;
  onUpdated?: () => void;
  compact?: boolean;
}

/** Hide construction controls once project is completed or in handover */
function isConstructionRelevant(status: string) {
  return status !== "completed" && status !== "handover";
}

export function ProjectProgressEditor({
  projectId,
  status: initialStatus,
  constructionPct: initialPct,
  canEdit,
  onUpdated,
  compact,
}: ProjectProgressEditorProps) {
  const [status, setStatus] = useState(initialStatus);
  const [pct, setPct] = useState(String(initialPct));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);

  const showConstruction = isConstructionRelevant(status);

  useEffect(() => {
    setStatus(initialStatus);
    setPct(String(initialPct));
    setDirty(false);
  }, [initialStatus, initialPct, projectId]);

  if (!canEdit) {
    return (
      <div className={compact ? "text-sm" : ""}>
        <p className="text-sm text-[var(--muted)]">
          {PROJECT_STATUS_LABELS[initialStatus] ?? initialStatus}
          {isConstructionRelevant(initialStatus) && ` · ${initialPct}% construction`}
        </p>
        {isConstructionRelevant(initialStatus) && (
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-teal-600 transition-all"
              style={{ width: `${Math.min(100, Math.max(0, initialPct))}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  async function save() {
    const constructionPct = Math.min(100, Math.max(0, parseInt(pct, 10) || 0));
    setSaving(true);
    setError("");
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        ...(isConstructionRelevant(status) ? { constructionPct } : {}),
      }),
    });
    setSaving(false);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to update project");
      return;
    }
    setPct(String(data.project.constructionPct));
    setStatus(data.project.status);
    setDirty(false);
    onUpdated?.();
  }

  return (
    <div
      className={compact ? "space-y-2" : "card space-y-4 p-4"}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {!compact && <h3 className="text-sm font-semibold text-[var(--brand)]">Project progress</h3>}

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Project status</span>
        <select
          className="input"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setDirty(true);
          }}
        >
          {PROJECT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {PROJECT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>

      {showConstruction && (
        <>
          <label className="block text-sm">
            <span className="mb-1 flex items-center justify-between font-medium">
              <span>Construction completion</span>
              <span className="text-[var(--brand)]">
                {Math.min(100, Math.max(0, parseInt(pct, 10) || 0))}%
              </span>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              className="w-full accent-teal-700"
              value={Math.min(100, Math.max(0, parseInt(pct, 10) || 0))}
              onChange={(e) => {
                setPct(e.target.value);
                setDirty(true);
              }}
            />
            <input
              type="number"
              min={0}
              max={100}
              className="input mt-2 w-24"
              value={pct}
              onChange={(e) => {
                setPct(e.target.value);
                setDirty(true);
              }}
            />
          </label>

          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-teal-600 transition-all"
              style={{ width: `${Math.min(100, Math.max(0, parseInt(pct, 10) || 0))}%` }}
            />
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        className="btn-primary text-sm"
        disabled={saving || !dirty}
        onClick={() => void save()}
      >
        {saving ? "Saving…" : "Save progress"}
      </button>
    </div>
  );
}
