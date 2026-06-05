import { AnimatedSection } from "./AnimatedSection";

const audiences = [
  { label: "Developers", desc: "Multi-project visibility" },
  { label: "Sales teams", desc: "Live inventory & pipeline" },
  { label: "Finance", desc: "Collections & overdue" },
  { label: "Operations", desc: "Documents & handover" },
];

const capabilities = [
  "Tower-wise inventory",
  "Milestone collections",
  "Customer portal",
  "WhatsApp updates",
  "Document vault",
  "Agent performance",
];

export function BuiltForSection() {
  return (
    <AnimatedSection className="py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <p className="landing-eyebrow mb-4">Designed for</p>
            <h2 className="landing-section-title text-left">
              Teams running real projects — not generic pipelines.
            </h2>
            <div className="mt-8 space-y-4">
              {audiences.map((item) => (
                <div
                  key={item.label}
                  className="flex items-baseline justify-between border-b border-[var(--border)] pb-4 last:border-0"
                >
                  <span className="font-semibold text-[var(--foreground)]">{item.label}</span>
                  <span className="text-sm text-[var(--muted)]">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="landing-glass rounded-2xl p-8">
            <p className="landing-eyebrow mb-4">Built to handle</p>
            <div className="flex flex-wrap gap-2">
              {capabilities.map((cap) => (
                <span
                  key={cap}
                  className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-[var(--brand)]"
                >
                  {cap}
                </span>
              ))}
            </div>
            <p className="landing-body mt-8 text-left text-base">
              No inflated metrics. Just a platform shaped for how real estate operations
              actually run day to day.
            </p>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
