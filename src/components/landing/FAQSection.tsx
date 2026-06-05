"use client";

import { useState } from "react";
import { AnimatedSection } from "./AnimatedSection";
import { SectionHeading, SectionLabel } from "./SectionHeader";

const faqs = [
  {
    q: "Who is Vikraya built for?",
    a: "Vikraya is purpose-built for real estate developers, builders, sales teams, and finance teams managing residential or commercial projects — apartments, villas, plots, and multi-phase launches.",
  },
  {
    q: "Can we manage multiple projects and towers?",
    a: "Yes. Each project has its own inventory grid, booking pipeline, payment schedules, and document vault. Filter by tower, floor, and unit type across all active phases.",
  },
  {
    q: "How does payment and collection tracking work?",
    a: "Define milestone-based installment plans per project. Finance teams see upcoming dues, overdue amounts, and collection progress — with receipts generated automatically when payments are recorded.",
  },
  {
    q: "Do customers get a self-service portal?",
    a: "Buyers log in via OTP to view their unit details, payment timeline, construction updates, and download agreements or receipts — reducing repetitive calls to your sales and finance teams.",
  },
  {
    q: "How are documents stored and shared?",
    a: "Agreements, allotment letters, receipts, and NOCs are organized per customer and project in a secure cloud vault. Documents can be delivered via the customer portal or WhatsApp on request.",
  },
  {
    q: "Can we track agent performance and commissions?",
    a: "Every booking is attributed to an agent with revenue contribution and commission breakdowns visible on dashboards — across projects, towers, and sales phases.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <AnimatedSection id="faq" className="py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <SectionLabel>Queries</SectionLabel>
          <SectionHeading
            title="Help center"
            description="Answers to common questions about inventory, collections, documents, and customer access."
          />
        </div>

        <div className="mt-12 space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={faq.q}
                className="landing-glass overflow-hidden rounded-xl"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold text-[var(--foreground)]">{faq.q}</span>
                  <span className="shrink-0 text-[var(--brand-light)]">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && (
                  <div className="border-t border-[var(--border)] px-5 pb-4 pt-2">
                    <p className="text-sm leading-relaxed text-[var(--muted)]">{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <p className="text-sm text-[var(--muted)]">Need help?</p>
          <a
            href="mailto:hello@vikrayaos.com"
            className="landing-btn-secondary px-5 py-2.5 text-sm"
          >
            Contact Support
          </a>
        </div>
      </div>
    </AnimatedSection>
  );
}
