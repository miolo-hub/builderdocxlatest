import Link from "next/link";
import { AnimatedSection } from "./AnimatedSection";
import { SectionHeading, SectionLabel } from "./SectionHeader";

const tools = [
  {
    href: "/portal/login",
    category: "Operations Hub",
    title: "CRM Portal",
    desc: "Manage projects, inventory grids, clients, deals, and agent commissions from one workspace.",
    cta: "Open Portal",
  },
  {
    href: "/portal/payments",
    category: "Collections",
    title: "Payments Dashboard",
    desc: "Track installment schedules, record collections, surface overdue amounts, and monitor collection rates.",
    cta: "View Payments",
  },
  {
    href: "/simulator",
    category: "Customer Access",
    title: "WhatsApp Simulator",
    desc: "Prototype buyer self-service — OTP login, payment schedules, document downloads, and construction updates.",
    cta: "Open Simulator",
  },
  {
    href: "/portal/templates",
    category: "Documentation",
    title: "Document Templates",
    desc: "Generate sale agreements, allotment letters, price breakups, and receipts tied to each booking.",
    cta: "Browse Templates",
  },
];

export function PlatformToolsSection() {
  return (
    <AnimatedSection id="tools" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <SectionLabel>Applications</SectionLabel>
            <SectionHeading
              align="left"
              title="Essential real estate tools"
              description="Built-in utilities to streamline project sales, collections, and customer management — no separate systems required."
            />
          </div>
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            Tools available: {tools.length}
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {tools.map((tool, i) => (
            <AnimatedSection
              key={tool.title}
              delay={i * 60}
              className="landing-glass landing-glass-hover flex flex-col rounded-2xl p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-light)]">
                {tool.category}
              </p>
              <h3 className="mt-2 text-xl font-bold text-[var(--foreground)]">{tool.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--muted)]">{tool.desc}</p>
              <Link
                href={tool.href}
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand)] transition hover:text-[var(--brand-light)]"
              >
                {tool.cta}
                <span aria-hidden>→</span>
              </Link>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}
