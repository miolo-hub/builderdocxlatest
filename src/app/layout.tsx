import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PropTrack CRM — Real Estate Marketing CRM",
  description:
    "Inventory, payments, documents, WhatsApp automation, and agent commissions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
