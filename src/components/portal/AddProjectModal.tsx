"use client";

import { useState } from "react";
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS, PROJECT_TYPES } from "@/lib/constants";

interface AddProjectModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function AddProjectModal({ open, onClose, onCreated }: AddProjectModalProps) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("residential");
  const [status, setStatus] = useState("active");
  const [totalUnits, setTotalUnits] = useState("");
  const [constructionPct, setConstructionPct] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  function reset() {
    setName("");
    setLocation("");
    setType("residential");
    setStatus("active");
    setTotalUnits("");
    setConstructionPct("0");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        location,
        type,
        status,
        totalUnits: totalUnits || 0,
        constructionPct,
      }),
    });
    setLoading(false);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to create project");
      return;
    }
    reset();
    onCreated();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--brand)]">Add project</h2>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-800">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Project name *</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Location</span>
            <input
              className="input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City / area"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Type</span>
              <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
                {PROJECT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Status</span>
              <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {PROJECT_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Planned units</span>
              <input
                type="number"
                min={0}
                className="input"
                value={totalUnits}
                onChange={(e) => setTotalUnits(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Construction %</span>
              <input
                type="number"
                min={0}
                max={100}
                className="input"
                value={constructionPct}
                onChange={(e) => setConstructionPct(e.target.value)}
              />
            </label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? "Saving…" : "Add project"}
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
