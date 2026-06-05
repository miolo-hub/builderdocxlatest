"use client";

import { useState } from "react";
import { AnimatedSection } from "./AnimatedSection";

type UnitStatus = "available" | "reserved" | "sold" | "blocked";

const statusStyles: Record<UnitStatus, string> = {
  available: "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200",
  reserved: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200",
  sold: "bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300",
  blocked: "bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200",
};

const statusLabels: Record<UnitStatus, string> = {
  available: "Available — can be sold",
  reserved: "Reserved — hold placed",
  sold: "Sold — booking done",
  blocked: "Blocked — not for sale",
};

function buildGrid(): UnitStatus[] {
  const pattern: UnitStatus[] = ["sold", "reserved", "available", "blocked"];
  return Array.from({ length: 64 }, (_, i) => pattern[i % 4]);
}

export function InventoryShowcase() {
  const [hovered, setHovered] = useState<{ unit: string; status: UnitStatus } | null>(null);
  const grid = buildGrid();

  return (
    <AnimatedSection id="inventory" className="scroll-mt-28 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="landing-eyebrow mb-4">Feature 1 · Flat inventory</p>
            <h2 className="landing-section-title text-left !text-3xl sm:!text-4xl">
              See which flats are free — floor by floor, tower by tower.
            </h2>
            <p className="landing-body mt-5 max-w-[520px] text-left">
              Open one screen and know exactly what is available, reserved, sold, or
              blocked. Your sales team stops promising flats that are already booked.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                "Colour-coded grid — green, amber, grey, red at a glance",
                "Filter by tower, floor, and flat type",
                "Updates instantly when a booking happens",
              ].map((item) => (
                <li key={item} className="flex gap-3 text-sm text-[var(--muted)]">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand-light)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-teal-50/70 blur-2xl" />
            <div className="landing-glass relative overflow-hidden rounded-3xl p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[var(--brand)]">Skyline Residences</p>
                  <p className="text-xs text-[var(--muted)]">Tower A · Floors 8–15</p>
                </div>
                {hovered ? (
                  <div className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs">
                    <span className="font-bold text-[var(--foreground)]">Flat {hovered.unit}</span>
                    <span className="mx-1.5 text-[var(--muted)]">·</span>
                    <span className="text-[var(--brand)]">{statusLabels[hovered.status]}</span>
                  </div>
                ) : (
                  <p className="text-xs text-[var(--muted)]">Tap or hover a flat</p>
                )}
              </div>

              <div className="grid grid-cols-8 gap-1.5 sm:gap-2">
                {grid.map((status, i) => {
                  const floor = 8 + Math.floor(i / 8);
                  const unit = `${floor}${String((i % 8) + 1).padStart(2, "0")}`;
                  return (
                    <button
                      key={i}
                      type="button"
                      className={`landing-unit-cell flex aspect-square items-center justify-center rounded-md border text-[9px] font-bold sm:text-[10px] ${statusStyles[status]}`}
                      onMouseEnter={() => setHovered({ unit, status })}
                      onFocus={() => setHovered({ unit, status })}
                    >
                      {unit}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2 text-[10px] text-[var(--muted)] sm:grid-cols-4">
                {(Object.entries(statusLabels) as [UnitStatus, string][]).map(([status, label]) => (
                  <span key={status} className="flex items-center gap-1.5">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-sm border ${statusStyles[status].split(" ").slice(0, 2).join(" ")}`} />
                    <span className="leading-tight">{label.split(" — ")[0]}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
