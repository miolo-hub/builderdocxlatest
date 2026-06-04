"use client";

import { useState } from "react";

interface AddCustomerModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function AddCustomerModal({
  open,
  onClose,
  onCreated,
}: AddCustomerModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [unit, setUnit] = useState("");
  const [tower, setTower] = useState("");
  const [project, setProject] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  function resetForm() {
    setName("");
    setPhone("");
    setEmail("");
    setUnit("");
    setTower("");
    setProject("");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, email, unit, tower, project }),
    });
    setLoading(false);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to add customer");
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
          <h2 className="text-xl font-bold text-[var(--brand)]">Add customer</h2>
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
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Unit / flat *</span>
              <input
                className="input"
                placeholder="4B"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                required
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Tower / block *</span>
              <input
                className="input"
                placeholder="Tower 2"
                value={tower}
                onChange={(e) => setTower(e.target.value)}
                required
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Project *</span>
            <input
              className="input"
              placeholder="Prestige Lakeside Habitat"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              required
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? "Saving…" : "Add customer"}
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
