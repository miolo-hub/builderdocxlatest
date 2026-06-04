"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PortalNav } from "@/components/portal/PortalNav";
import { DocumentUploadForm } from "@/components/portal/DocumentUploadForm";
import { DOCUMENT_TYPE_LABELS } from "@/lib/constants";
import type { DocumentRecord } from "@/lib/types";

interface User {
  name: string;
  role: "admin" | "sales" | "document_manager";
  builderName?: string;
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<{
    name: string;
    phone: string;
    unit: string;
    tower: string;
    project: string;
  } | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);

  const load = useCallback(async () => {
    const me = await fetch("/api/auth/me");
    if (!me.ok) {
      router.push("/portal/login");
      return;
    }
    setUser((await me.json()).user);
    const res = await fetch(`/api/customers/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setCustomer(data.customer);
    setDocuments(data.documents);
  }, [id, router]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!user || !customer) {
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
        <Link
          href="/portal/dashboard"
          className="mb-4 inline-block text-sm text-teal-700 hover:underline"
        >
          ← Back to customers
        </Link>

        <div className="mb-8 card p-6">
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <p className="text-[var(--muted)]">{customer.phone}</p>
          <p className="mt-2 font-medium text-[var(--brand)]">
            Unit {customer.unit} · {customer.tower} · {customer.project}
          </p>
          <Link
            href="/simulator"
            className="mt-3 inline-block text-sm text-teal-700 hover:underline"
          >
            Test in WhatsApp simulator →
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <DocumentUploadForm
            customerId={id}
            customerName={customer.name}
            onUploaded={load}
          />

          <div className="card p-5">
            <h3 className="mb-4 font-semibold text-[var(--brand)]">
              Documents ({documents.length})
            </h3>
            <ul className="space-y-3">
              {documents.map((d) => (
                <li
                  key={d.id}
                  className="flex items-start justify-between gap-2 border-b border-[var(--border)] pb-3 last:border-0"
                >
                  <div>
                    <p className="font-medium">
                      {d.title || DOCUMENT_TYPE_LABELS[d.type]}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {d.documentDate} · {d.uploadedBy}
                    </p>
                    <p className="text-xs text-slate-500">{d.fileName}</p>
                  </div>
                  <span
                    className={`badge shrink-0 ${
                      d.visibility === "customer"
                        ? "badge-customer"
                        : "badge-internal"
                    }`}
                  >
                    {d.visibility === "customer" ? "Customer" : "Internal"}
                  </span>
                </li>
              ))}
              {documents.length === 0 && (
                <p className="text-sm text-[var(--muted)]">No documents yet.</p>
              )}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
