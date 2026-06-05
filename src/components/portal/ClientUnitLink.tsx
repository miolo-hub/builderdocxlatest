"use client";

import { useEffect, useState } from "react";

interface Project {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  unitNumber: string;
  block: string | null;
  status: string;
}

interface ClientUnitLinkProps {
  clientId: string;
  projectName: string | null;
  unit: string | null;
  tower: string | null;
  canEdit: boolean;
  onSaved: () => void;
}

export function ClientUnitLink({
  clientId,
  projectName,
  unit,
  tower,
  canEdit,
  onSaved,
}: ClientUnitLinkProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitId, setUnitId] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!canEdit) return;
    void fetch("/api/projects").then(async (res) => {
      if (!res.ok) return;
      const list = (await res.json()).projects as Project[];
      setProjects(list);
      const match = list.find(
        (p) => p.name.toLowerCase() === (projectName ?? "").toLowerCase()
      );
      if (match) setProjectId(match.id);
    });
  }, [canEdit, projectName]);

  useEffect(() => {
    if (!projectId) {
      setUnits([]);
      return;
    }
    void fetch(`/api/projects/${projectId}/units`).then(async (res) => {
      if (!res.ok) return;
      const list = (await res.json()).units as Unit[];
      setUnits(list);
      const match = list.find(
        (u) => u.unitNumber.toLowerCase() === (unit ?? "").toLowerCase()
      );
      if (match) setUnitId(match.id);
    });
  }, [projectId, unit]);

  if (!canEdit) {
    return (
      <p className="text-sm text-[var(--muted)]">
        {unit ? `Unit ${unit}` : "No unit linked"}
        {projectName ? ` · ${projectName}` : ""}
        {tower ? ` · ${tower}` : ""}
      </p>
    );
  }

  async function saveLink() {
    const selected = units.find((u) => u.id === unitId);
    const project = projects.find((p) => p.id === projectId);
    if (!selected || !project) {
      setMsg("Select a project and flat");
      return;
    }
    setSaving(true);
    setMsg("");
    const res = await fetch(`/api/clients/${clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stage: "booked",
        unitId: selected.id,
        unit: selected.unitNumber,
        projectName: project.name,
        tower: selected.block,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setMsg(data.error ?? "Failed to link");
      return;
    }
    setMsg("Flat linked — inventory counts updated.");
    onSaved();
  }

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
      <p className="mb-2 font-medium">Link flat to inventory</p>
      <p className="mb-3 text-xs text-[var(--muted)]">
        Required for booked/sold status to show correctly in project inventory. A final
        price (cost breakup or deal) is required before marking as booked.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium">Project</span>
          <select
            className="input"
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value);
              setUnitId("");
            }}
          >
            <option value="">Select project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium">Flat</span>
          <select
            className="input"
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            disabled={!projectId}
          >
            <option value="">Select flat</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.unitNumber} ({u.status})
                {u.block ? ` · ${u.block}` : ""}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        type="button"
        className="btn-primary mt-3 text-xs"
        disabled={saving || !unitId}
        onClick={() => void saveLink()}
      >
        {saving ? "Linking…" : "Link flat & mark sold in inventory"}
      </button>
      {msg && (
        <p className={`mt-2 text-xs ${msg.includes("updated") ? "text-green-700" : "text-red-600"}`}>
          {msg}
        </p>
      )}
    </div>
  );
}
