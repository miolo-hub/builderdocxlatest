import { AnimatedSection } from "./AnimatedSection";
import { SectionHeading, SectionLabel } from "./SectionHeader";

const steps = [
  {
    num: "01",
    title: "Sales & Inventory",
    description:
      "Vikraya connects lead capture, site visits, unit blocking, token collection, and booking confirmation — with live inventory synced at every stage.",
    stages: [
      { label: "Lead captured", status: "complete" as const },
      { label: "Site visit logged", status: "complete" as const },
      { label: "Unit reserved", status: "complete" as const },
      { label: "Token received", status: "active" as const },
      { label: "Agreement pending", status: "pending" as const },
    ],
    panelTitle: "Pipeline status",
    panelRows: [
      { k: "Customer", v: "Ananya Desai" },
      { k: "Unit", v: "Tower B · 1204" },
      { k: "Agent", v: "Karthik N." },
    ],
  },
  {
    num: "02",
    title: "Collections & Handover",
    description:
      "From booking amount to construction-linked slabs — track dues, record payments, generate receipts, and deliver documents via portal or WhatsApp.",
    stages: [
      { label: "Booking amount", status: "complete" as const },
      { label: "Slab 1 — Foundation", status: "complete" as const },
      { label: "Slab 2 — Structure", status: "active" as const },
      { label: "Documents issued", status: "pending" as const },
    ],
    panelTitle: "Next collection",
    panelRows: [
      { k: "Due date", v: "20 Jun 2025" },
      { k: "Amount", v: "₹22,00,000" },
      { k: "Status", v: "Reminder sent" },
    ],
  },
];

function StageBadge({ status }: { status: "complete" | "active" | "pending" }) {
  const styles = {
    complete: "bg-emerald-50 text-emerald-800 border-emerald-200",
    active: "bg-teal-50 text-[var(--brand)] border-teal-200",
    pending: "bg-slate-50 text-[var(--muted)] border-[var(--border)]",
  };
  const labels = {
    complete: "Complete",
    active: "In progress",
    pending: "Pending",
  };

  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export function ProcessSection() {
  return (
    <AnimatedSection id="process" className="landing-section-alt py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel>How It Works</SectionLabel>
          <SectionHeading
            title="Complete project operations process"
            description="Vikraya compiles inventory, sales workflow, payment collection, and document delivery into a single executable system — no missing steps or disconnected teams."
          />
        </div>

        <div className="mt-16 space-y-10">
          {steps.map((step, i) => (
            <AnimatedSection
              key={step.num}
              delay={i * 80}
              className="landing-glass overflow-hidden rounded-2xl"
            >
              <div className="grid lg:grid-cols-2">
                <div className="border-b border-[var(--border)] p-8 lg:border-b-0 lg:border-r">
                  <span className="font-mono text-sm font-bold text-[var(--brand-light)]">
                    STEP {step.num}
                  </span>
                  <h3 className="mt-2 text-2xl font-bold text-[var(--foreground)]">{step.title}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
                    {step.description}
                  </p>
                  <div className="mt-8 space-y-3">
                    {step.stages.map((stage) => (
                      <div
                        key={stage.label}
                        className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-white/70 px-4 py-3"
                      >
                        <span className="text-sm font-medium text-[var(--foreground)]">
                          {stage.label}
                        </span>
                        <StageBadge status={stage.status} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50/80 p-8">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    {step.panelTitle}
                  </p>
                  <div className="mt-4 rounded-xl border border-[var(--border)] bg-white p-5">
                    {step.panelRows.map((row) => (
                      <div
                        key={row.k}
                        className="flex items-center justify-between border-b border-[var(--border)] py-3 last:border-0 last:pb-0 first:pt-0"
                      >
                        <span className="text-sm text-[var(--muted)]">{row.k}</span>
                        <span className="text-sm font-semibold text-[var(--foreground)]">{row.v}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-[var(--brand-light)]">
                    Transaction overview · Live sync
                  </p>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}
