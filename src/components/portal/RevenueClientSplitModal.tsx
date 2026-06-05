"use client";

import Link from "next/link";
import { fmtCurrency } from "@/components/portal/DashboardCharts";

export type ClientRevenueRow = {
  clientId: string;
  name: string;
  unit: string;
  expected: number;
  collected: number;
  direct: number;
  advance: number;
  bankLoan: number;
};

interface RevenueClientSplitModalProps {
  open: boolean;
  title: string;
  mode: "expected" | "collected";
  rows: ClientRevenueRow[];
  onClose: () => void;
}

export function RevenueClientSplitModal({
  open,
  title,
  mode,
  rows,
  onClose,
}: RevenueClientSplitModalProps) {
  if (!open) return null;

  const filtered = rows.filter((r) => (mode === "expected" ? r.expected > 0 : r.collected > 0));
  const total = filtered.reduce(
    (s, r) => s + (mode === "expected" ? r.expected : r.collected),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card max-h-[85vh] w-full max-w-2xl overflow-y-auto p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--brand)]">{title}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {mode === "expected"
                ? "Per-client expected revenue from sold flats and deal prices."
                : "Per-client collected amounts — direct payments, booking advance, and bank loan."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No client data for this view yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-[var(--muted)]">
                <th className="pb-2 pr-3">Client</th>
                <th className="pb-2 pr-3">Unit</th>
                {mode === "expected" ? (
                  <th className="pb-2 text-right">Expected</th>
                ) : (
                  <>
                    <th className="pb-2 pr-2 text-right">Direct</th>
                    <th className="pb-2 pr-2 text-right">Advance</th>
                    <th className="pb-2 pr-2 text-right">Bank loan</th>
                    <th className="pb-2 text-right">Total</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.clientId} className="border-b border-slate-50">
                  <td className="py-2 pr-3">
                    <Link
                      href={`/portal/clients/${r.clientId}`}
                      className="font-medium text-teal-700 hover:underline"
                    >
                      {r.name}
                    </Link>
                  </td>
                  <td className="py-2 pr-3 text-[var(--muted)]">{r.unit}</td>
                  {mode === "expected" ? (
                    <td className="py-2 text-right font-medium">{fmtCurrency(r.expected)}</td>
                  ) : (
                    <>
                      <td className="py-2 pr-2 text-right">{fmtCurrency(r.direct)}</td>
                      <td className="py-2 pr-2 text-right">{fmtCurrency(r.advance)}</td>
                      <td className="py-2 pr-2 text-right">{fmtCurrency(r.bankLoan)}</td>
                      <td className="py-2 text-right font-medium">{fmtCurrency(r.collected)}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td className="pt-3 pr-3" colSpan={2}>
                  Total ({filtered.length} clients)
                </td>
                {mode === "expected" ? (
                  <td className="pt-3 text-right">{fmtCurrency(total)}</td>
                ) : (
                  <>
                    <td colSpan={3} />
                    <td className="pt-3 text-right">{fmtCurrency(total)}</td>
                  </>
                )}
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
