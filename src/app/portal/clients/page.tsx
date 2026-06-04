"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PropTrackShell } from "@/components/portal/PropTrackShell";
import { AddCustomerModal } from "@/components/portal/AddCustomerModal";
import type { UserRole } from "@/lib/rbac";

export default function ClientsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: UserRole; builderName?: string } | null>(null);
  const [query, setQuery] = useState("");
  const [clients, setClients] = useState<{ id: string; name: string; phone: string; unit: string | null; stage: string; projectName: string | null }[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  const search = useCallback(async (q: string) => {
    const res = await fetch(`/api/clients?q=${encodeURIComponent(q)}`);
    if (res.ok) setClients((await res.json()).clients);
  }, []);

  useEffect(() => {
    void fetch("/api/auth/me").then(async (me) => {
      if (!me.ok) router.push("/portal/login");
      else {
        setUser((await me.json()).user);
        void search("");
      }
    });
  }, [router, search]);

  useEffect(() => {
    const t = setTimeout(() => search(query), 200);
    return () => clearTimeout(t);
  }, [query, search]);

  if (!user) return null;

  return (
    <PropTrackShell user={user}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-bold">Clients</h1>
        <button type="button" className="btn-primary" onClick={() => setShowAdd(true)}>
          + Add client
        </button>
      </div>
      <input
        className="input mb-6 max-w-xl"
        placeholder="Search…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <AddCustomerModal open={showAdd} onClose={() => setShowAdd(false)} onCreated={() => search(query)} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {clients.map((c) => (
          <Link key={c.id} href={`/portal/clients/${c.id}`} className="card block p-5 hover:border-teal-300">
            <h2 className="font-semibold">{c.name}</h2>
            <p className="text-sm text-[var(--muted)]">{c.phone}</p>
            <p className="mt-2 text-sm capitalize text-[var(--brand)]">{c.stage.replace("_", " ")}</p>
            {c.unit && <p className="text-xs text-[var(--muted)]">Unit {c.unit}</p>}
          </Link>
        ))}
      </div>
    </PropTrackShell>
  );
}
