import Link from "next/link";
import { AnimatedSection } from "./AnimatedSection";

export function FinalCTA() {
  return (
    <AnimatedSection id="cta" className="landing-section-alt py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="landing-section-title !text-3xl sm:!text-4xl">
          Ready to stop juggling Excel and WhatsApp?
        </h2>
        <p className="landing-body mx-auto mt-5">
          See how Vikraya handles flats, buyers, payments, and documents — built
          for real estate project teams.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4">
          <Link href="/portal/login" className="landing-btn-shimmer landing-btn-primary px-10 py-3.5 text-base">
            See Platform
          </Link>
          <a href="mailto:hello@vikrayaos.com" className="landing-text-link text-sm">
            Talk to us →
          </a>
        </div>
      </div>
    </AnimatedSection>
  );
}
