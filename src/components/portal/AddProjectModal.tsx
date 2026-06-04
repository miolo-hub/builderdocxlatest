"use client";

import { useMemo, useState } from "react";
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
  const [available, setAvailable] = useState("");
  const [reserved, setReserved] = useState("");
  const [sold, setSold] = useState("");
  const [blocked, setBlocked] = useState("");
  const [defaultBasePrice, setDefaultBasePrice] = useState("");
  const [constructionPct, setConstructionPct] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalUnits = useMemo(
    () =>
      (parseInt(available, 10) || 0) +
      (parseInt(reserved, 10) || 0) +
      (parseInt(sold, 10) || 0) +
      (parseInt(blocked, 10) || 0),
    [available, reserved, sold, blocked]
  );

  if (!open) return null;

  function reset() {
    setName("");
    setLocation("");
    setType("residential");
    setStatus("active");
    setAvailable("");
    setReserved("");
    setSold("");
    setBlocked("");
    setDefaultBasePrice("");
    setConstructionPct("0");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (totalUnits === 0) {
      setError("Enter at least one unit across the inventory fields.");
      return;
    }
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
        available,
        reserved,
        sold,
        blocked,
        defaultBasePrice,
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

          <div>
            <p className="mb-2 text-sm font-medium">Initial inventory *</p>
            <p className="mb-3 text-xs text-[var(--muted)]">
              Creates units in the database (e.g. AV-001 available, SL-001 sold). Total:{" "}
              <strong>{totalUnits}</strong>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="mb-1 block text-green-800">Available</span>
                <input
                  type="number"
                  min={0}
                  className="input"
                  value={available}
                  onChange={(e) => setAvailable(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-yellow-800">Reserved</span>
                <input
                  type="number"
                  min={0}
                  className="input"
                  value={reserved}
                  onChange={(e) => setReserved(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-red-800">Sold</span>
                <input
                  type="number"
                  min={0}
                  className="input"
                  value={sold}
                  onChange={(e) => setSold(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-slate-700">Blocked</span>
                <input
                  type="number"
                  min={0}
                  className="input"
                  value={blocked}
                  onChange={(e) => setBlocked(e.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Default unit price (₹)</span>
              <input
                type="number"
                min={0}
                className="input"
                value={defaultBasePrice}
                onChange={(e) => setDefaultBasePrice(e.target.value)}
                placeholder="Optional"
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
