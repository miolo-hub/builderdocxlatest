import Link from "next/link";

export function LandingFooter() {
  return (
    <footer id="contact" className="border-t border-[var(--border)] bg-white py-12">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-8 px-4 sm:flex-row sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--brand)] text-xs font-bold text-white">
            V
          </span>
          <div>
            <span className="font-bold text-[var(--brand)]">Vikraya</span>
            <p className="text-xs text-[var(--muted)]">For real estate projects</p>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--muted)]">
          <a href="#features" className="transition hover:text-[var(--brand)]">
            Features
          </a>
          <a href="#inventory" className="transition hover:text-[var(--brand)]">
            Flat inventory
          </a>
          <a href="mailto:hello@vikrayaos.com" className="transition hover:text-[var(--brand)]">
            Contact
          </a>
          <Link href="/portal/login" className="font-semibold text-[var(--brand)]">
            Open Platform
          </Link>
        </nav>
      </div>

      <p className="mt-8 text-center text-xs text-[var(--muted)]">
        © {new Date().getFullYear()} Vikraya · vikrayaos.com
      </p>
    </footer>
  );
}
