import { AnimatedSection } from "./AnimatedSection";

const audiences = [
  "Property developers",
  "Builders & sales teams",
  "Finance & collections",
  "Multi-project operators",
];

const projectTypes = [
  "Apartments & towers",
  "Villas & plotted developments",
  "Commercial projects",
  "Multi-phase launches",
];

export function OperationsSection() {
  return (
    <AnimatedSection className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="landing-glass mx-auto max-w-4xl rounded-3xl px-8 py-12 text-center sm:px-12 sm:py-14">
          <h2
            className="text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl"
            style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}
          >
            Designed for modern real estate operations
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[var(--muted)]">
            Whether you manage apartments, villas, plotted developments, or multiple
            ongoing projects, Vikraya helps your team stay organized and operate faster.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-base text-[var(--muted)]">
            Built to simplify daily operations for developers, builders, finance teams,
            and sales teams.
          </p>

          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-white/70 p-6 text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand)]">
                Built for
              </p>
              <ul className="mt-4 space-y-2">
                {audiences.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-light)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-white/70 p-6 text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand)]">
                Project types
              </p>
              <ul className="mt-4 space-y-2">
                {projectTypes.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-light)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
