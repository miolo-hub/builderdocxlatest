"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AddCustomerModal } from "@/components/portal/AddCustomerModal";
import { PortalNav } from "@/components/portal/PortalNav";

interface Customer {
  id: string;
  name: string;
  phone: string;
  unit: string;
  tower: string;
  project: string;
}

interface User {
  name: string;
  role: "admin" | "sales" | "document_manager";
  builderName?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const loadUser = useCallback(async () => {
    const res = await fetch("/api/auth/me");
    if (!res.ok) {
      router.push("/portal/login");
      return null;
    }
    const data = await res.json();
    setUser(data.user);
    return data.user;
  }, [router]);

  const search = useCallback(async (q: string) => {
    const res = await fetch(`/api/customers?q=${encodeURIComponent(q)}`);
    if (res.ok) {
      const data = await res.json();
      setCustomers(data.customers);
    }
  }, []);

  useEffect(() => {
    void loadUser().then((u) => {
      if (u) void search("");
      setLoading(false);
    });
  }, [loadUser, search]);

  useEffect(() => {
    const t = setTimeout(() => search(query), 200);
    return () => clearTimeout(t);
  }, [query, search]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[var(--muted)]">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <PortalNav user={user} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Customers</h1>
            <p className="text-[var(--muted)]">
              Stored in Neon PostgreSQL · search by name, phone, unit, or tower
            </p>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowAdd(true)}
          >
            + Add customer
          </button>
        </div>

        <div className="mb-6">
          <input
            className="input max-w-xl"
            placeholder="Search customers…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <AddCustomerModal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          onCreated={() => search(query)}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map((c) => (
            <Link
              key={c.id}
              href={`/portal/customers/${c.id}`}
              className="card block p-5 transition hover:border-teal-300 hover:shadow-md"
            >
              <h2 className="font-semibold text-slate-900">{c.name}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">{c.phone}</p>
              <p className="mt-2 text-sm font-medium text-[var(--brand)]">
                Unit {c.unit} · {c.tower}
              </p>
              <p className="text-xs text-[var(--muted)]">{c.project}</p>
            </Link>
          ))}
        </div>

        {customers.length === 0 && (
          <p className="text-center text-[var(--muted)]">No customers found.</p>
        )}
      </main>
    </div>
  );
}
