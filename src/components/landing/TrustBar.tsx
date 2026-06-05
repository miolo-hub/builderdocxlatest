export function TrustBar() {
  return (
    <section className="landing-section-alt py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-8 text-center text-sm font-semibold text-[var(--foreground)]">
          Tailor-made CRM deployments across real estate, services, and growth teams
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {[
            "Real Estate",
            "Healthcare",
            "Education",
            "Manufacturing",
            "Retail",
            "Logistics",
          ].map((name) => (
            <span
              key={name}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold ${
                name === "Real Estate"
                  ? "border-teal-300 bg-teal-50 text-[var(--brand)]"
                  : "border-[var(--border)] bg-white text-[var(--muted)]"
              }`}
            >
              {name === "Real Estate" ? "Real Estate · New" : name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
