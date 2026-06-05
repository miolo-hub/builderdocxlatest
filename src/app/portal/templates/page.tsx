"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PropTrackShell } from "@/components/portal/PropTrackShell";
import { TEMPLATE_CATEGORY_LABELS, type TemplateCategory } from "@/lib/document-templates";
import { can, type UserRole } from "@/lib/rbac";

type TemplateRow = {
  id: string;
  name: string;
  description: string | null;
  category: TemplateCategory;
  isSystem: boolean;
};

export default function TemplatesPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: UserRole; builderName?: string } | null>(null);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [createCategory, setCreateCategory] = useState<TemplateCategory>("cost_breakup");
  const [createName, setCreateName] = useState("");
  const [cloneFromId, setCloneFromId] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/templates");
    if (res.ok) setTemplates((await res.json()).templates);
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

  async function createTemplate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: createCategory,
        name: createName,
        cloneFromId: cloneFromId || undefined,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const { template } = await res.json();
      setShowCreate(false);
      setCreateName("");
      setCloneFromId("");
      router.push(`/portal/templates/${template.id}/edit`);
    }
  }

  async function removeTemplate(id: string, name: string) {
    if (!confirm(`Delete custom template "${name}"?`)) return;
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    void load();
  }

  if (!user) return null;

  const categories: TemplateCategory[] = ["cost_breakup", "payment_receipt"];

  return (
    <PropTrackShell user={user}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Templates</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Default document templates for cost breakup and payment receipts. Create custom
            templates for your builder.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setShowCreate(true)}>
          + Create custom template
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={createTemplate} className="card w-full max-w-md space-y-4 p-6">
            <h2 className="text-lg font-bold">New custom template</h2>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Category</span>
              <select
                className="input"
                value={createCategory}
                onChange={(e) => setCreateCategory(e.target.value as TemplateCategory)}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {TEMPLATE_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Template name</span>
              <input
                className="input"
                required
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="My cost breakup"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Start from (optional)</span>
              <select
                className="input"
                value={cloneFromId}
                onChange={(e) => setCloneFromId(e.target.value)}
              >
                <option value="">Blank / default fields</option>
                {templates
                  .filter((t) => t.category === createCategory)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </label>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary flex-1" disabled={saving}>
                {saving ? "Creating…" : "Create & edit fields"}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {categories.map((cat) => {
        const items = templates.filter((t) => t.category === cat);
        return (
          <section key={cat} className="mb-8">
            <h2 className="mb-3 text-lg font-semibold">{TEMPLATE_CATEGORY_LABELS[cat]}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {items.map((t) => (
                <div key={t.id} className="card p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{t.name}</h3>
                      {t.isSystem && (
                        <span className="mt-1 inline-block rounded bg-teal-50 px-2 py-0.5 text-xs text-teal-800">
                          Default template
                        </span>
                      )}
                    </div>
                    {!t.isSystem && (
                      <button
                        type="button"
                        className="text-xs text-red-600 hover:underline"
                        onClick={() => void removeTemplate(t.id, t.name)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  {t.description && (
                    <p className="mt-2 text-sm text-[var(--muted)]">{t.description}</p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {!t.isSystem && (
                      <Link href={`/portal/templates/${t.id}/edit`} className="btn-primary text-sm">
                        Edit fields
                      </Link>
                    )}
                    {t.isSystem && (
                      <button
                        type="button"
                        className="btn-secondary text-sm"
                        onClick={() => {
                          setCreateCategory(t.category);
                          setCloneFromId(t.id);
                          setCreateName(`${t.name} (custom)`);
                          setShowCreate(true);
                        }}
                      >
                        Duplicate & customize
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </PropTrackShell>
  );
}
