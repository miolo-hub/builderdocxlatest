"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PropTrackShell } from "@/components/portal/PropTrackShell";
import { DEFAULT_PRICE_BREAKUP_FIELDS, type PriceBreakupFieldDef } from "@/lib/price-breakup-fields";
import { can, type UserRole } from "@/lib/rbac";

export default function PriceBreakupSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: UserRole; builderName?: string } | null>(null);
  const [fields, setFields] = useState<PriceBreakupFieldDef[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/settings/price-breakup-fields");
    if (res.ok) {
      const data = await res.json();
      setFields(data.fields ?? DEFAULT_PRICE_BREAKUP_FIELDS);
    }
  }, []);

  useEffect(() => {
    void fetch("/api/auth/me").then(async (me) => {
      if (!me.ok) router.push("/portal/login");
      else {
        const u = (await me.json()).user;
        if (!can(u.role, "clients.manage")) {
          router.push("/portal/dashboard");
          return;
        }
        setUser(u);
        void load();
      }
    });
  }, [router, load]);

  function addField() {
    const key = `custom_${Date.now()}`;
    setFields((f) => [
      ...f,
      { key, label: "New field", type: "text", order: f.length + 1 },
    ]);
  }

  function updateField(index: number, patch: Partial<PriceBreakupFieldDef>) {
    setFields((f) => f.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeField(index: number) {
    setFields((f) => f.filter((_, i) => i !== index));
  }

  async function save() {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/settings/price-breakup-fields", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: fields.map((f, i) => ({ ...f, order: i + 1 })),
      }),
    });
    setSaving(false);
    if (res.ok) {
      setMessage("Saved. New clients will use these fields in the price breakup form.");
      void load();
    } else {
      const data = await res.json();
      setMessage(data.error ?? "Save failed");
    }
  }

  function resetDefaults() {
    if (!confirm("Reset to default price breakup fields?")) return;
    setFields([...DEFAULT_PRICE_BREAKUP_FIELDS]);
  }

  if (!user) return null;

  return (
    <PropTrackShell user={user}>
      <Link href="/portal/clients" className="mb-4 inline-block text-sm text-teal-700 hover:underline">
        ← Clients
      </Link>
      <h1 className="mb-2 text-2xl font-bold">Price breakup fields</h1>
      <p className="mb-6 max-w-2xl text-sm text-[var(--muted)]">
        Customize the form used when generating a price breakup letter from a client profile
        (GST, IGST, carpet area, flat number, etc.).
      </p>

      <div className="card space-y-4 p-6">
        {fields.map((f, i) => (
          <div
            key={`${f.key}-${i}`}
            className="grid gap-3 border-b border-slate-100 pb-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-[var(--muted)]">Label</span>
              <input
                className="input"
                value={f.label}
                onChange={(e) => updateField(i, { label: e.target.value })}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-[var(--muted)]">Field key</span>
              <input
                className="input font-mono text-xs"
                value={f.key}
                onChange={(e) => updateField(i, { key: e.target.value.replace(/\s/g, "_") })}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-[var(--muted)]">Type</span>
              <select
                className="input"
                value={f.type}
                onChange={(e) =>
                  updateField(i, { type: e.target.value as PriceBreakupFieldDef["type"] })
                }
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="select">Select</option>
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
                className="text-xs text-red-600 hover:underline"
                onClick={() => removeField(i)}
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
          <button type="button" className="btn-secondary text-sm" onClick={resetDefaults}>
            Reset defaults
          </button>
          <button type="button" className="btn-primary text-sm" disabled={saving} onClick={() => void save()}>
            {saving ? "Saving…" : "Save configuration"}
          </button>
        </div>
        {message && <p className="text-sm text-teal-800">{message}</p>}
      </div>
    </PropTrackShell>
  );
}
