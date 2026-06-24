import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { Footer } from "@/components/Footer";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";

export const metadata: Metadata = {
  title: {
    default: "Automotive Headlights, Exhaust Pipes & Body Kits | Cowinmotors",
    template: "%s | Cowinmotors",
  },
  description:
    "Source aftermarket headlights, exhaust parts, and body kits with clear fitment data, MOQ, lead times, QC inspection, and worldwide shipping support.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AnalyticsTracker />
        {children}
        <Footer />
        <WhatsAppFloat />
      </body>
    </html>
  );
}
