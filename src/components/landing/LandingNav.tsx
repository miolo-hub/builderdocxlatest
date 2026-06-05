"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "landing-nav-scrolled" : "bg-[var(--background)]/80"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand)] text-sm font-bold text-white">
            V
          </span>
          <span className="text-lg font-bold tracking-tight text-[var(--brand)]">Vikraya</span>
        </Link>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/portal/login" className="landing-btn-shimmer landing-btn-primary px-5 py-2.5 text-sm">
            See Platform
          </Link>
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--brand)] md:hidden"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="landing-glass border-t border-[var(--border)] px-4 py-4 md:hidden">
          <Link
            href="/portal/login"
            className="landing-btn-shimmer landing-btn-primary block px-4 py-2.5 text-center text-sm"
            onClick={() => setMenuOpen(false)}
          >
            See Platform
          </Link>
        </div>
      )}
    </header>
  );
}
