"use client";

import { useEffect, useState } from "react";
import { CLIENT_STAGE_LABELS, CLIENT_STAGES } from "@/lib/constants";

interface AddCustomerModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface Project {
  id: string;
  name: string;
}

interface UnitOption {
  id: string;
  unitNumber: string;
  block: string | null;
  floor: string | null;
  status: string;
}

export function AddCustomerModal({
  open,
  onClose,
  onCreated,
}: AddCustomerModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [stage, setStage] = useState("prospect");
  const [projectId, setProjectId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    void fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        const list = (data.projects ?? []) as Project[];
        setProjects(list);
        if (list.length === 1) setProjectId(list[0].id);
      });
  }, [open]);

  useEffect(() => {
    if (!projectId) {
      setUnits([]);
      setUnitId("");
      return;
    }
    void fetch(`/api/projects/${projectId}/units`)
      .then((res) => res.json())
      .then((data) => {
        const list = ((data.units ?? []) as UnitOption[]).sort((a, b) =>
          a.unitNumber.localeCompare(b.unitNumber, undefined, { numeric: true })
        );
        setUnits(list);
        setUnitId("");
      });
  }, [projectId]);

  if (!open) return null;

  const selectedProject = projects.find((p) => p.id === projectId);

  function resetForm() {
    setName("");
    setPhone("");
    setEmail("");
    setStage("prospect");
    setProjectId("");
    setUnitId("");
    setUnits([]);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId) {
      setError("Select a project");
      return;
    }
    if (!unitId) {
      setError("Select a flat from the project inventory");
      return;
    }
    const selected = units.find((u) => u.id === unitId);
    if (!selected) {
      setError("Invalid flat selection");
      return;
    }

    setLoading(true);
    setError("");
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone,
        email,
        stage,
        unitId: selected.id,
        unit: selected.unitNumber,
        tower: selected.block,
        projectName: selectedProject?.name,
      }),
    });
    setLoading(false);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to add client");
      return;
    }
    resetForm();
    onCreated();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--brand)]">Add client</h2>
          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="text-slate-500 hover:text-slate-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Full name *</span>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Mobile number *</span>
            <input
              className="input"
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Email</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Project *</span>
            <select
              className="input"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              required
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Flat / unit *</span>
            <select
              className="input"
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              required
              disabled={!projectId || units.length === 0}
            >
              <option value="">
                {!projectId
                  ? "Select project first"
                  : units.length === 0
                    ? "No flats in this project"
                    : "Select flat"}
              </option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unitNumber}
                  {u.block ? ` · ${u.block}` : ""}
                  {u.floor ? ` · floor ${u.floor}` : ""} — {u.status}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Picked from inventory so status updates always match (e.g. A101, B102).
            </p>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Initial status</span>
            <select className="input" value={stage} onChange={(e) => setStage(e.target.value)}>
              {CLIENT_STAGES.map((s) => (
                <option key={s} value={s}>
                  {CLIENT_STAGE_LABELS[s]}
                </option>
              ))}
            </select>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? "Saving…" : "Add client"}
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
