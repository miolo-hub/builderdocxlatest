import { AnimatedSection } from "./AnimatedSection";

const pains = [
  {
    title: "Scattered spreadsheets",
    desc: "Inventory, bookings, and collections tracked in separate files that never stay in sync.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
      />
    ),
  },
  {
    title: "Manual tracking",
    desc: "Payment follow-ups, site visits, and document requests handled one call and one sheet at a time.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
  {
    title: "Disconnected teams",
    desc: "Sales, finance, and operations work from different tools with no shared view of the customer or unit.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
      />
    ),
  },
  {
    title: "No live project visibility",
    desc: "Developers cannot see sold percentage, overdue collections, or booking pipeline without pulling reports manually.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    ),
  },
];

export function ProblemSection() {
  return (
    <AnimatedSection id="problems" className="landing-section-alt py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            className="text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl"
            style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}
          >
            Real estate operations break when tools don&apos;t connect
          </h2>
          <p className="mt-4 text-lg text-[var(--muted)]">
            Most teams still run projects across spreadsheets, WhatsApp groups, and
            manual registers — losing visibility, speed, and revenue along the way.
          </p>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {pains.map((pain, i) => (
            <AnimatedSection
              key={pain.title}
              delay={i * 80}
              className="landing-glass landing-glass-hover rounded-2xl p-6"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50">
                <svg
                  className="h-5 w-5 text-[var(--accent)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {pain.icon}
                </svg>
              </div>
              <h3 className="font-bold text-[var(--foreground)]">{pain.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{pain.desc}</p>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}
