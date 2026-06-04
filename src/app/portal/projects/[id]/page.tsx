"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PropTrackShell } from "@/components/portal/PropTrackShell";
import type { UserRole } from "@/lib/rbac";

const STATUS_COLOR: Record<string, string> = {
  available: "bg-green-100 text-green-800",
  reserved: "bg-yellow-100 text-yellow-800",
  sold: "bg-red-100 text-red-800",
  blocked: "bg-slate-200 text-slate-700",
};

export default function InventoryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: UserRole; builderName?: string } | null>(null);
  const [units, setUnits] = useState<{
    id: string;
    unitNumber: string;
    floor: string | null;
    block: string | null;
    basePrice: number;
    status: string;
    client: { name: string } | null;
  }[]>([]);

  const load = useCallback(async () => {
    const me = await fetch("/api/auth/me");
    if (!me.ok) {
      router.push("/portal/login");
      return;
    }
    setUser((await me.json()).user);
    const res = await fetch(`/api/projects/${id}/units`);
    if (res.ok) setUnits((await res.json()).units);
  }, [id, router]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!user) return null;

  return (
    <PropTrackShell user={user}>
      <Link href="/portal/projects" className="mb-4 inline-block text-sm text-teal-700 hover:underline">
        ← Projects
      </Link>
      <h1 className="mb-2 text-2xl font-bold">Inventory grid</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        🟢 Available · 🟡 Reserved · 🔴 Sold · ⚫ Blocked
      </p>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {units.map((u) => (
          <div key={u.id} className="card p-4">
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
              <p className="mt-1 text-xs text-teal-800">{u.client.name}</p>
            )}
          </div>
        ))}
      </div>
    </PropTrackShell>
  );
}
