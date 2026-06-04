"use client";

import { useEffect, useState } from "react";
import { buildMilestoneInstallments } from "@/lib/deal-installments";

interface Project {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  unitNumber: string;
  block: string | null;
  floor: string | null;
  basePrice: number;
  status: string;
}

interface Agent {
  id: string;
  name: string;
}

interface BookFlatModalProps {
  open: boolean;
  clientId: string;
  clientName: string;
  defaultAgentId?: string | null;
  onClose: () => void;
  onBooked: () => void;
}

export function BookFlatModal({
  open,
  clientId,
  clientName,
  defaultAgentId,
  onClose,
  onBooked,
}: BookFlatModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [projectId, setProjectId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [agentId, setAgentId] = useState(defaultAgentId ?? "");
  const [bookingDate, setBookingDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [totalValue, setTotalValue] = useState("");
  const [discount, setDiscount] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setAgentId(defaultAgentId ?? "");
    setError("");
    void (async () => {
      const [projRes, agentRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/agents"),
      ]);
      if (projRes.ok) {
        const list = (await projRes.json()).projects as Project[];
        setProjects(list);
        if (list.length === 1) setProjectId(list[0].id);
      }
      if (agentRes.ok) {
        setAgents((await agentRes.json()).agents);
      }
    })();
  }, [open, defaultAgentId]);

  useEffect(() => {
    if (!projectId) {
      setUnits([]);
      setUnitId("");
      return;
    }
    void (async () => {
      const res = await fetch(`/api/projects/${projectId}/units`);
      if (res.ok) {
        const all = (await res.json()).units as Unit[];
        setUnits(all.filter((u) => u.status === "available"));
      }
    })();
  }, [projectId]);

  useEffect(() => {
    const unit = units.find((u) => u.id === unitId);
    if (unit) setTotalValue(String(unit.basePrice));
  }, [unitId, units]);

  if (!open) return null;

  const selectedUnit = units.find((u) => u.id === unitId);
  const finalPrice =
    parseFloat(totalValue || "0") - parseFloat(discount || "0");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!unitId || !agentId) {
      setError("Select a unit and agent");
      return;
    }
    if (finalPrice <= 0) {
      setError("Sale price must be greater than discount");
      return;
    }

    setLoading(true);
    setError("");
    const installments = buildMilestoneInstallments(finalPrice, bookingDate);
    const res = await fetch("/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        unitId,
        agentId,
        bookingDate,
        totalValue: parseFloat(totalValue),
        discount: parseFloat(discount || "0"),
        paymentPlanType: "milestone",
        installments,
      }),
    });
    setLoading(false);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not create booking");
      return;
    }
    onBooked();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--brand)]">Book flat</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Record a booking for <strong>{clientName}</strong>. Status will move to{" "}
          <strong>Booked</strong> and a payment schedule will be created.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Project *</span>
            <select
              className="input"
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setUnitId("");
              }}
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
            <span className="mb-1 block font-medium">Available unit *</span>
            <select
              className="input"
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              required
              disabled={!projectId}
            >
              <option value="">
                {projectId ? "Select unit" : "Choose project first"}
              </option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unitNumber}
                  {u.block ? ` — ${u.block}` : ""}
                  {u.floor ? ` (floor ${u.floor})` : ""} · ₹
                  {u.basePrice.toLocaleString("en-IN")}
                </option>
              ))}
            </select>
            {projectId && units.length === 0 && (
              <p className="mt-1 text-xs text-amber-700">
                No available units in this project.
              </p>
            )}
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Sales agent *</span>
            <select
              className="input"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              required
            >
              <option value="">Select agent</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Booking date *</span>
            <input
              type="date"
              className="input"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              required
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Sale value (₹) *</span>
              <input
                type="number"
                className="input"
                min={1}
                value={totalValue}
                onChange={(e) => setTotalValue(e.target.value)}
                required
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Discount (₹)</span>
              <input
                type="number"
                className="input"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </label>
          </div>

          {selectedUnit && finalPrice > 0 && (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-[var(--muted)]">
              Final price: <strong>₹{finalPrice.toLocaleString("en-IN")}</strong>{" "}
              · 5 milestone installments will be generated automatically
            </p>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading || !unitId || units.length === 0}
            >
              {loading ? "Booking…" : "Confirm booking"}
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
