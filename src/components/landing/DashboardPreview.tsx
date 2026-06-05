"use client";

import { AnimatedSection } from "./AnimatedSection";
import { FullDashboardMockup } from "./mockups";
import { useInView } from "./hooks/useInView";

export function DashboardPreview() {
  const { ref, isVisible } = useInView(0.1);

  return (
    <AnimatedSection id="dashboard" className="scroll-mt-28 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="landing-eyebrow mb-3">Feature 7 · Project dashboard</p>
            <h2 className="landing-section-title text-left !text-3xl sm:!text-4xl">
              One screen to see how your project is doing.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-[var(--muted)]">
              Flats sold, money collected, buyers with pending payments, and recent
              bookings — everything a developer or sales head needs, on one page.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {[
                { label: "Flats sold", value: "68%" },
                { label: "Money collected", value: "₹142 Cr" },
                { label: "Pending dues", value: "₹22 L" },
                { label: "Active bookings", value: "14" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-[var(--border)] bg-white/80 px-4 py-3"
                >
                  <p className="text-xs text-[var(--muted)]">{item.label}</p>
                  <p className="mt-1 text-lg font-bold text-[var(--brand)]">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div
            ref={ref}
            className="landing-hero-stage relative"
            style={{
              transform: isVisible ? "translateY(0)" : "translateY(16px)",
              transition: "transform 0.8s ease",
            }}
          >
            <div className="landing-hero-glow absolute -inset-4 rounded-3xl blur-2xl" />
            <div className={`relative ${isVisible ? "landing-float" : ""}`}>
              <div className="landing-hero-tilt">
                <FullDashboardMockup />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
