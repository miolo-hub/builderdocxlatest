"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { VikrayaShell } from "@/components/portal/VikrayaShell";
import type { TemplateFieldDef } from "@/lib/document-templates";
import { can, type UserRole } from "@/lib/rbac";

export default function TemplateEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: UserRole; builderName?: string } | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<TemplateFieldDef[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/templates/${id}`);
    if (!res.ok) {
      router.push("/portal/templates");
      return;
    }
    const data = await res.json();
    if (data.template.isSystem) {
      router.push("/portal/templates");
      return;
    }
    setName(data.template.name);
    setDescription(data.template.description ?? "");
    setFields(data.fields ?? []);
  }, [id, router]);

  useEffect(() => {
    void fetch("/api/auth/me").then(async (me) => {
      if (!me.ok) router.push("/portal/login");
      else {
        const u = (await me.json()).user;
        if (!can(u.role, "clients.manage")) router.push("/portal/dashboard");
        else {
          setUser(u);
          void load();
        }
      }
    });
  }, [router, load]);

  function addField() {
    setFields((f) => [
      ...f,
      { key: `field_${Date.now()}`, label: "New field", type: "text", order: f.length + 1 },
    ]);
  }

  function updateField(i: number, patch: Partial<TemplateFieldDef>) {
    setFields((f) => f.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  async function save() {
    setSaving(true);
    setMessage("");
    const res = await fetch(`/api/templates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        fields: fields.map((f, i) => ({ ...f, order: i + 1 })),
      }),
    });
    setSaving(false);
    if (res.ok) setMessage("Template saved.");
    else setMessage((await res.json()).error ?? "Save failed");
  }

  if (!user) return null;

  return (
    <VikrayaShell user={user}>
      <Link href="/portal/templates" className="mb-4 inline-block text-sm text-teal-700 hover:underline">
        ← Templates
      </Link>
      <h1 className="mb-6 text-2xl font-bold">Edit template</h1>

      <div className="card mb-6 space-y-4 p-6">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Name</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Description</span>
          <input
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
      </div>

      <div className="card space-y-4 p-6">
        <h2 className="font-semibold">Fields</h2>
        {fields.map((f, i) => (
          <div
            key={`${f.key}-${i}`}
            className="grid gap-3 border-b border-slate-100 pb-4 sm:grid-cols-2 lg:grid-cols-5"
          >
            <label className="text-sm">
              <span className="mb-1 block text-xs text-[var(--muted)]">Label</span>
              <input
                className="input"
                value={f.label}
                onChange={(e) => updateField(i, { label: e.target.value })}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs text-[var(--muted)]">Key</span>
              <input
                className="input font-mono text-xs"
                value={f.key}
                onChange={(e) => updateField(i, { key: e.target.value.replace(/\s/g, "_") })}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs text-[var(--muted)]">Type</span>
              <select
                className="input"
                value={f.type}
                onChange={(e) =>
                  updateField(i, { type: e.target.value as TemplateFieldDef["type"] })
                }
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="select">Select</option>
                <option value="section">Section header</option>
                <option value="computed">Computed (auto)</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs text-[var(--muted)]">Compute</span>
              <select
                className="input"
                value={f.compute ?? ""}
                onChange={(e) =>
                  updateField(i, {
                    compute: e.target.value
                      ? (e.target.value as TemplateFieldDef["compute"])
                      : undefined,
                  })
                }
              >
                <option value="">—</option>
                <option value="basic_flat_cost">Basic flat cost</option>
                <option value="net_basic">Net basic (A)</option>
                <option value="gst_amount">GST amount</option>
                <option value="igst_amount">IGST amount</option>
                <option value="total">Total (B)</option>
              </select>
            </label>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!f.required}
                  onChange={(e) => updateField(i, { required: e.target.checked })}
                />
                Required
              </label>
              <button
                type="button"
                className="text-xs text-red-600"
                onClick={() => setFields((all) => all.filter((_, j) => j !== i))}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        <div className="flex flex-wrap gap-3 pt-2">
          <button type="button" className="btn-secondary text-sm" onClick={addField}>
            + Add field
          </button>
          <button type="button" className="btn-primary text-sm" disabled={saving} onClick={() => void save()}>
            {saving ? "Saving…" : "Save template"}
          </button>
        </div>
        {message && <p className="text-sm text-teal-800">{message}</p>}
      </div>
    </VikrayaShell>
  );
}
