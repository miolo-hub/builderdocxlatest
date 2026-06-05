"use client";

import Link from "next/link";
import { HeroDashboardMockup } from "./mockups";

export function HeroVisual() {
  return (
    <div className="landing-hero-stage relative mx-auto max-w-5xl">
      <div className="landing-hero-glow absolute -inset-8 rounded-[2rem] bg-gradient-to-br from-teal-200/40 via-transparent to-emerald-100/30 blur-3xl" />
      <div className="landing-hero-float-card absolute -left-2 top-16 z-20 hidden rounded-xl border border-[var(--border)] bg-white/95 px-4 py-3 shadow-xl sm:block">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
          Flats sold today
        </p>
        <p className="text-lg font-bold text-[var(--brand)]">3 units</p>
      </div>
      <div className="landing-hero-float-card landing-hero-float-delay absolute -right-2 top-32 z-20 hidden rounded-xl border border-[var(--border)] bg-white/95 px-4 py-3 shadow-xl sm:block">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
          Money collected
        </p>
        <p className="text-lg font-bold text-emerald-600">₹18.4 Cr</p>
      </div>
      <div className="landing-hero-tilt relative z-10">
        <div className="landing-shimmer-border overflow-hidden rounded-2xl">
          <HeroDashboardMockup />
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-32 sm:px-6 lg:px-8 lg:pb-28 lg:pt-36">
      <div className="landing-orb landing-orb-1 absolute left-[10%] top-[15%] h-64 w-64" />
      <div className="landing-orb landing-orb-2 absolute right-[8%] top-[25%] h-80 w-80" />
      <div className="landing-dot-grid absolute inset-0 opacity-50" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="landing-eyebrow mb-5">Vikraya for real estate projects</p>

          <h1 className="landing-hero-title">
            Run your flats, buyers, and payments{" "}
            <span className="landing-gradient-text">from one place.</span>
          </h1>

          <p className="landing-hero-sub mx-auto mt-6">
            See which units are free, track every booking, follow up on payments, and
            keep buyer documents ready — without Excel sheets and WhatsApp chaos.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4">
            <Link href="/portal/login" className="landing-btn-shimmer landing-btn-primary px-10 py-3.5 text-base">
              See Platform
            </Link>
            <a href="#features" className="landing-text-link text-sm">
              View all features →
            </a>
          </div>
        </div>

        <div className="mt-14 lg:mt-16">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}
