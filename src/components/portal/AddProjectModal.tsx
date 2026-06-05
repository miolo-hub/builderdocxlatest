"use client";

import { useMemo, useState } from "react";
import { formatUnitNumber, previewTowerLayout } from "@/lib/inventory-layout";
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS, PROJECT_TYPES } from "@/lib/constants";

type SetupMode = "tower_layout" | "excel";

interface AddProjectModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function AddProjectModal({ open, onClose, onCreated }: AddProjectModalProps) {
  const [mode, setMode] = useState<SetupMode>("tower_layout");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("residential");
  const [status, setStatus] = useState("active");
  const [towerCount, setTowerCount] = useState("7");
  const [floors, setFloors] = useState("10");
  const [flatsPerFloor, setFlatsPerFloor] = useState("3");
  const [defaultBasePrice, setDefaultBasePrice] = useState("");
  const [constructionPct, setConstructionPct] = useState("0");
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const preview = useMemo(() => {
    const tc = parseInt(towerCount, 10) || 0;
    const f = parseInt(floors, 10) || 0;
    const fp = parseInt(flatsPerFloor, 10) || 0;
    if (!tc || !f || !fp) return null;
    try {
      return previewTowerLayout({ towerCount: tc, floors: f, flatsPerFloor: fp });
    } catch {
      return null;
    }
  }, [towerCount, floors, flatsPerFloor]);

  if (!open) return null;

  function reset() {
    setMode("tower_layout");
    setName("");
    setLocation("");
    setType("residential");
    setStatus("active");
    setTowerCount("7");
    setFloors("10");
    setFlatsPerFloor("3");
    setDefaultBasePrice("");
    setConstructionPct("0");
    setExcelFile(null);
    setBrochureFile(null);
    setError("");
  }

  async function uploadBrochure(projectId: string) {
    if (!brochureFile) return;
    const form = new FormData();
    form.append("file", brochureFile);
    await fetch(`/api/projects/${projectId}/brochure`, { method: "POST", body: form });
  }

  async function handleTowerSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!preview?.total) {
      setError("Enter valid tower, floor, and flat counts.");
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
        towerCount,
        floors,
        flatsPerFloor,
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
    if (data.project?.id) await uploadBrochure(data.project.id);
    reset();
    onCreated();
    onClose();
  }

  async function handleExcelSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!excelFile) {
      setError("Choose an Excel or CSV file.");
      return;
    }
    setLoading(true);
    setError("");
    const form = new FormData();
    form.append("name", name);
    form.append("location", location);
    form.append("type", type);
    form.append("status", status);
    form.append("constructionPct", constructionPct);
    form.append("file", excelFile);

    const res = await fetch("/api/projects", { method: "POST", body: form });
    setLoading(false);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Import failed");
      return;
    }
    if (data.project?.id) await uploadBrochure(data.project.id);
    reset();
    onCreated();
    onClose();
  }

  const exampleUnits =
    preview?.sample.length &&
    `${preview.sample.slice(0, 6).join(", ")}${preview.total > 6 ? "…" : ""}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card max-h-[90vh] w-full max-w-xl overflow-y-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--brand)]">Add project</h2>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-800">
            ✕
          </button>
        </div>

        <div className="mb-4 flex gap-2 rounded-lg bg-slate-100 p-1 text-sm">
          <button
            type="button"
            className={`flex-1 rounded-md px-3 py-2 font-medium ${
              mode === "tower_layout" ? "bg-white shadow-sm" : "text-[var(--muted)]"
            }`}
            onClick={() => setMode("tower_layout")}
          >
            New project (towers)
          </button>
          <button
            type="button"
            className={`flex-1 rounded-md px-3 py-2 font-medium ${
              mode === "excel" ? "bg-white shadow-sm" : "text-[var(--muted)]"
            }`}
            onClick={() => setMode("excel")}
          >
            Import Excel / CSV
          </button>
        </div>

        <div className="mb-4 space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Project name *</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Location</span>
              <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} />
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
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Project brochure (optional)</span>
            <input
              type="file"
              className="input"
              accept=".pdf,image/*"
              onChange={(e) => setBrochureFile(e.target.files?.[0] ?? null)}
            />
            <span className="mt-1 block text-xs text-[var(--muted)]">
              PDF or image — attached to welcome emails after a flat is booked.
            </span>
          </label>
        </div>

        {mode === "tower_layout" ? (
          <form onSubmit={handleTowerSubmit} className="space-y-4">
            <p className="text-sm text-[var(--muted)]">
              Generates flats like <strong>A101, A102, A103</strong> (Tower A, floor 1) and{" "}
              <strong>B101, B102…</strong> for each tower. All units start as{" "}
              <strong>available</strong>; status updates when you book a client.
            </p>
            <div className="grid grid-cols-3 gap-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Towers *</span>
                <input
                  type="number"
                  min={1}
                  max={26}
                  className="input"
                  value={towerCount}
                  onChange={(e) => setTowerCount(e.target.value)}
                  required
                />
                <span className="text-xs text-[var(--muted)]">A–Z (max 26)</span>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Floors *</span>
                <input
                  type="number"
                  min={1}
                  max={99}
                  className="input"
                  value={floors}
                  onChange={(e) => setFloors(e.target.value)}
                  required
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Flats / floor *</span>
                <input
                  type="number"
                  min={1}
                  max={99}
                  className="input"
                  value={flatsPerFloor}
                  onChange={(e) => setFlatsPerFloor(e.target.value)}
                  required
                />
              </label>
            </div>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Default price per flat (₹)</span>
              <input
                type="number"
                min={0}
                className="input"
                value={defaultBasePrice}
                onChange={(e) => setDefaultBasePrice(e.target.value)}
                placeholder="Optional"
              />
            </label>
            {preview && (
              <div className="rounded-lg bg-slate-50 p-3 text-sm">
                <p>
                  <strong>{preview.total}</strong> units will be created (all available).
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Examples: {exampleUnits}
                  {towerCount && floors && flatsPerFloor && (
                    <> · e.g. {formatUnitNumber("A", 1, 1)}, {formatUnitNumber("B", 1, 1)}</>
                  )}
                </p>
              </div>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <button type="submit" className="btn-primary flex-1" disabled={loading}>
                {loading ? "Creating…" : "Create project & inventory"}
              </button>
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleExcelSubmit} className="space-y-4">
            <p className="text-sm text-[var(--muted)]">
              For an <strong>existing</strong> project with mixed statuses (sold, blocked, etc.).
              Upload Excel (.xlsx, .xls) or CSV with one row per flat.
            </p>
            <a
              href="/api/projects/inventory-template"
              download="inventory-template.csv"
              className="inline-block text-sm font-medium text-teal-700 hover:underline"
            >
              Download template CSV →
            </a>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-[var(--muted)]">
              <p className="font-medium text-slate-700">Columns</p>
              <p className="mt-1 font-mono">
                tower, floor, flat, unit_number, block, status, base_price
              </p>
              <p className="mt-2">
                <strong>unit_number</strong> optional if tower + floor + flat are set.{" "}
                <strong>status</strong>: available, reserved, sold, blocked, cancelled
              </p>
            </div>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Spreadsheet file *</span>
              <input
                type="file"
                className="input"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setExcelFile(e.target.files?.[0] ?? null)}
                required
              />
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <button type="submit" className="btn-primary flex-1" disabled={loading}>
                {loading ? "Importing…" : "Import project & inventory"}
              </button>
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
