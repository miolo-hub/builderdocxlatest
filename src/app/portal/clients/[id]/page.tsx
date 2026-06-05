"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PropTrackShell } from "@/components/portal/PropTrackShell";
import { BookFlatModal } from "@/components/portal/BookFlatModal";
import { DocumentUploadForm } from "@/components/portal/DocumentUploadForm";
import { ClientStageSelect } from "@/components/portal/ClientStageSelect";
import { ClientUnitLink } from "@/components/portal/ClientUnitLink";
import { ClientWorkflow } from "@/components/portal/ClientWorkflow";
import { DOCUMENT_TYPE_LABELS } from "@/lib/constants";
import { can, type UserRole } from "@/lib/rbac";

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: UserRole; builderName?: string } | null>(null);
  const [showBook, setShowBook] = useState(false);
  const [client, setClient] = useState<{
    name: string;
    phone: string;
    email: string | null;
    stage: string;
    unit: string | null;
    tower: string | null;
    projectName: string | null;
    assignedAgentId: string | null;
    assignedAgent?: { name: string } | null;
    linkedUnitId?: string | null;
    workflowStep?: string;
    workflowData?: string | null;
    documents: { id: string; title: string; type: string; visibility: string }[];
    deals: {
      id: string;
      finalPrice: number;
      paymentStatus: string;
      unit: { unitNumber: string; block: string | null; project: { name: string } };
      schedule: { installmentNumber: number; amount: number; dueDate: string; status: string }[];
    }[];
    activities: { description: string; createdAt: string }[];
  } | null>(null);

  const load = useCallback(async () => {
    const me = await fetch("/api/auth/me");
    if (!me.ok) {
      router.push("/portal/login");
      return;
    }
    setUser((await me.json()).user);
    const res = await fetch(`/api/clients/${id}`);
    if (res.ok) setClient((await res.json()).client);
  }, [id, router]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!user || !client) return null;

  const canBook =
    can(user.role, "deals.manage") &&
    client.deals.length === 0 &&
    client.stage !== "cancelled";
  const canEditStage = can(user.role, "clients.update_stage");
  const canManageWorkflow = can(user.role, "clients.manage");
  const deal = client.deals[0];

  return (
    <PropTrackShell user={user}>
      <Link href="/portal/clients" className="mb-4 inline-block text-sm text-teal-700 hover:underline">
        ← Clients
      </Link>
      <div className="mb-6 card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{client.name}</h1>
            <p className="text-[var(--muted)]">
              {client.phone}
              {client.email ? ` · ${client.email}` : ""}
            </p>
            {(client.unit || client.projectName) && (
              <p className="mt-1 text-sm">
                {client.unit && <span>{client.unit}</span>}
                {client.tower && <span> · {client.tower}</span>}
                {client.projectName && <span> · {client.projectName}</span>}
              </p>
            )}
            {client.assignedAgent && (
              <p className="mt-1 text-sm text-[var(--muted)]">
                Agent: <span className="font-medium text-slate-700">{client.assignedAgent.name}</span>
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <label className="text-xs font-medium text-[var(--muted)]">Client status</label>
            <ClientStageSelect
              clientId={id}
              stage={client.stage}
              linkedUnitId={client.linkedUnitId}
              canEdit={canEditStage}
              onUpdated={() => void load()}
            />
            {canBook && (
              <button
                type="button"
                className="btn-primary text-sm"
                onClick={() => setShowBook(true)}
              >
                Book flat
              </button>
            )}
          </div>
        </div>
        {canEditStage && !deal && client.stage !== "cancelled" && (
          <ClientUnitLink
            clientId={id}
            projectName={client.projectName}
            unit={client.unit}
            tower={client.tower}
            canEdit={canEditStage}
            onSaved={() => void load()}
          />
        )}
      </div>

      <div className="mb-8">
        <ClientWorkflow
          clientId={id}
          clientName={client.name}
          clientEmail={client.email}
          clientStage={client.stage}
          hasDeal={!!deal}
          workflowStep={client.workflowStep ?? "prospect"}
          workflowDataRaw={client.workflowData ?? null}
          canEdit={canManageWorkflow}
          onUpdated={() => void load()}
        />
      </div>

      <BookFlatModal
        open={showBook}
        clientId={id}
        clientName={client.name}
        defaultAgentId={client.assignedAgentId}
        onClose={() => setShowBook(false)}
        onBooked={() => void load()}
      />
      <div className="grid gap-8 lg:grid-cols-2">
        <DocumentUploadForm customerId={id} customerName={client.name} onUploaded={load} />
        <div className="card p-5">
          <h3 className="mb-4 font-semibold">Documents</h3>
          <ul className="space-y-2 text-sm">
            {client.documents.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-2">
                <span>{d.title || DOCUMENT_TYPE_LABELS[d.type]}</span>
                <button
                  type="button"
                  className="text-xs text-teal-700 hover:underline"
                  onClick={async () => {
                    const res = await fetch(`/api/documents/${d.id}/download-url`);
                    if (res.ok) window.open((await res.json()).downloadUrl, "_blank");
                  }}
                >
                  Download
                </button>
              </li>
            ))}
            {client.documents.length === 0 && <li className="text-[var(--muted)]">None</li>}
          </ul>
        </div>
      </div>
      {deal && (
        <div className="mt-8 card p-5">
          <h3 className="mb-2 font-semibold">Booking</h3>
          <p className="mb-4 text-sm text-[var(--muted)]">
            {deal.unit.unitNumber}
            {deal.unit.block ? ` · ${deal.unit.block}` : ""} — {deal.unit.project.name} · ₹
            {deal.finalPrice.toLocaleString("en-IN")} ({deal.paymentStatus.replace("_", " ")})
          </p>
          <h4 className="mb-3 text-sm font-semibold">Payment schedule</h4>
          <ul className="space-y-2 text-sm">
            {deal.schedule.map((s) => (
              <li key={s.installmentNumber} className="flex justify-between">
                <span>#{s.installmentNumber} — {new Date(s.dueDate).toLocaleDateString("en-IN")}</span>
                <span>₹{s.amount.toLocaleString("en-IN")} ({s.status})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </PropTrackShell>
  );
}
