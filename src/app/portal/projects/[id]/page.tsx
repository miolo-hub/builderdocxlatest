"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ProjectProgressEditor } from "@/components/portal/ProjectProgressEditor";
import { VikrayaShell } from "@/components/portal/VikrayaShell";
import { can, type UserRole } from "@/lib/rbac";

const STATUS_COLOR: Record<string, string> = {
  available: "bg-green-100 text-green-800",
  reserved: "bg-yellow-100 text-yellow-800",
  sold: "bg-red-100 text-red-800",
  blocked: "bg-slate-200 text-slate-700",
};

const STATUS_LABEL: Record<string, string> = {
  available: "Available",
  reserved: "Reserved",
  sold: "Sold",
  blocked: "Blocked",
  cancelled: "Cancelled",
};

function normalizeFlatQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, "");
}

type ProjectMeta = {
  id: string;
  name: string;
  location: string;
  status: string;
  constructionPct: number;
};

export default function InventoryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: UserRole; builderName?: string } | null>(null);
  const [project, setProject] = useState<ProjectMeta | null>(null);
  const [units, setUnits] = useState<{
    id: string;
    unitNumber: string;
    floor: string | null;
    block: string | null;
    basePrice: number;
    finalPrice: number | null;
    status: string;
    client: { name: string } | null;
  }[]>([]);
  const [flatSearch, setFlatSearch] = useState("");

  const load = useCallback(async () => {
    const me = await fetch("/api/auth/me");
    if (!me.ok) {
      router.push("/portal/login");
      return;
    }
    setUser((await me.json()).user);

    const [projRes, unitsRes] = await Promise.all([
      fetch(`/api/projects/${id}`),
      fetch(`/api/projects/${id}/units`),
    ]);
    if (projRes.ok) setProject((await projRes.json()).project);
    if (unitsRes.ok) setUnits((await unitsRes.json()).units);
  }, [id, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const flatQuery = normalizeFlatQuery(flatSearch);

  const filteredUnits = useMemo(() => {
    if (!flatQuery) return units;
    return units.filter((u) => {
      const num = normalizeFlatQuery(u.unitNumber);
      const block = normalizeFlatQuery(u.block ?? "");
      return num.includes(flatQuery) || block.includes(flatQuery);
    });
  }, [units, flatQuery]);

  const lookupUnit = useMemo(() => {
    if (!flatQuery) return null;
    const exact = units.find((u) => normalizeFlatQuery(u.unitNumber) === flatQuery);
    if (exact) return exact;
    if (filteredUnits.length === 1) return filteredUnits[0];
    return null;
  }, [units, flatQuery, filteredUnits]);

  if (!user) return null;

  const canEditProgress = can(user.role, "projects.manage");

  return (
    <VikrayaShell user={user}>
      <Link href="/portal/projects" className="mb-4 inline-block text-sm text-teal-700 hover:underline">
        ← Projects
      </Link>

      {project && (
        <>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {project.location && (
            <p className="mb-4 text-sm text-[var(--muted)]">{project.location}</p>
          )}
          <div className="mb-6 max-w-md">
            <ProjectProgressEditor
              projectId={project.id}
              status={project.status}
              constructionPct={project.constructionPct}
              canEdit={canEditProgress}
              onUpdated={() => void load()}
            />
          </div>
        </>
      )}

      <h2 className="mb-2 text-lg font-semibold">Inventory grid</h2>
      <p className="mb-4 text-sm text-[var(--muted)]">
        🟢 Available · 🟡 Reserved · 🔴 Sold · ⚫ Blocked
      </p>

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <label className="block min-w-[200px] flex-1 text-sm">
          <span className="mb-1 block font-medium">Check flat availability</span>
          <input
            className="input"
            placeholder="Enter flat number (e.g. A-1204)"
            value={flatSearch}
            onChange={(e) => setFlatSearch(e.target.value)}
          />
        </label>
        {flatSearch.trim() && (
          <button
            type="button"
            className="btn-secondary text-sm"
            onClick={() => setFlatSearch("")}
          >
            Clear
          </button>
        )}
      </div>

      {flatQuery && lookupUnit && (
        <div
          className={`mb-4 rounded-lg border p-4 ${
            lookupUnit.status === "available"
              ? "border-green-200 bg-green-50/80"
              : lookupUnit.status === "reserved"
                ? "border-yellow-200 bg-yellow-50/80"
                : lookupUnit.status === "sold"
                  ? "border-red-200 bg-red-50/80"
                  : "border-slate-200 bg-slate-50"
          }`}
        >
          <p className="font-semibold">
            Flat {lookupUnit.unitNumber} — {STATUS_LABEL[lookupUnit.status] ?? lookupUnit.status}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {lookupUnit.block ? `${lookupUnit.block} · ` : ""}
            {lookupUnit.floor ? `Floor ${lookupUnit.floor} · ` : ""}
            Base ₹{lookupUnit.basePrice.toLocaleString("en-IN")}
          </p>
          {lookupUnit.client && (
            <p className="mt-1 text-sm text-teal-800">Linked to {lookupUnit.client.name}</p>
          )}
          {lookupUnit.status === "available" && (
            <p className="mt-1 text-sm text-green-800">This flat is free to book.</p>
          )}
        </div>
      )}

      {flatQuery && filteredUnits.length === 0 && (
        <p className="mb-4 text-sm text-amber-800">
          No flat found matching &ldquo;{flatSearch.trim()}&rdquo; in this project.
        </p>
      )}

      {flatQuery && filteredUnits.length > 1 && !lookupUnit && (
        <p className="mb-4 text-sm text-[var(--muted)]">
          {filteredUnits.length} flats match &ldquo;{flatSearch.trim()}&rdquo;
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filteredUnits.map((u) => (
          <div
            key={u.id}
            className={`card p-4 ${
              lookupUnit?.id === u.id ? "ring-2 ring-teal-500 ring-offset-2" : ""
            }`}
          >
            <div className="flex items-start justify-between">
              <span className="text-lg font-bold">{u.unitNumber}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[u.status] ?? ""}`}>
                {u.status}
              </span>
            </div>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {u.block} · Floor {u.floor}
            </p>
            <p className="mt-2 text-sm font-medium">
              ₹{(u.basePrice / 100000).toFixed(1)}L
            </p>
            {u.client && (
              <>
                <p className="mt-1 text-xs text-teal-800">{u.client.name}</p>
                {u.status === "sold" && u.finalPrice != null && u.finalPrice > 0 && (
                  <p className="text-xs font-semibold text-teal-900">
                    Final: ₹{u.finalPrice.toLocaleString("en-IN")}
                  </p>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </VikrayaShell>
  );
}
