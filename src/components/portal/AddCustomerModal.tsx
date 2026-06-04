"use client";

import { useEffect, useState } from "react";

interface AddCustomerModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface Project {
  id: string;
  name: string;
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
  const [projectName, setProjectName] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    void fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        const list = (data.projects ?? []) as Project[];
        setProjects(list);
        if (list.length === 1) setProjectName(list[0].name);
      });
  }, [open]);

  if (!open) return null;

  function resetForm() {
    setName("");
    setPhone("");
    setEmail("");
    setUnit("");
    setTower("");
    setProjectName("");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone,
        email,
        unit,
        tower,
        projectName,
      }),
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
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Unit / flat</span>
              <input
                className="input"
                placeholder="4B"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Tower / block</span>
              <input
                className="input"
                placeholder="Tower 2"
                value={tower}
                onChange={(e) => setTower(e.target.value)}
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Project</span>
            {projects.length > 0 ? (
              <select
                className="input"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              >
                <option value="">Select project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="input"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="No projects yet — enter name"
              />
            )}
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
