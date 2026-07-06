import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { Footer } from "@/components/Footer";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.cowinmotors.com"),
  title: {
    default: "Automotive Headlights, Exhaust Pipes, Wheels & Body Kits | Cowinmotors",
    template: "%s | Cowinmotors",
  },
  description:
    "Source aftermarket headlights, exhaust parts, wheels, and body kits with clear fitment data, MOQ, lead times, QC inspection, and worldwide shipping support.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "Cowinmotors",
    title: "Automotive Headlights, Exhaust Pipes, Wheels & Body Kits | Cowinmotors",
    description:
      "Source aftermarket headlights, exhaust parts, wheels, and body kits with clear fitment data, MOQ, lead times, QC inspection, and worldwide shipping support.",
    url: "https://www.cowinmotors.com",
    images: [{ url: "/assets/live/category-lighting.png", width: 1200, height: 900, alt: "Cowinmotors automotive lighting and parts" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Automotive Headlights, Exhaust Pipes, Wheels & Body Kits | Cowinmotors",
    description:
      "Source aftermarket headlights, exhaust parts, wheels, and body kits with fitment confirmation, QC inspection, and worldwide shipping support.",
    images: ["/assets/live/category-lighting.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
    shortcut: ["/favicon.ico"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Cowinmotors",
    url: "https://www.cowinmotors.com",
    logo: "https://www.cowinmotors.com/assets/live/logo.jpg",
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+86-176-0125-5205",
        contactType: "sales",
        areaServed: "Worldwide",
        availableLanguage: ["en"],
      },
    ],
    sameAs: ["https://www.cowinmotors.com"],
  };

  return (
    <html lang="en">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        <AnalyticsTracker />
        {children}
        <Footer />
        <WhatsAppFloat />
      </body>
    </html>
  );
}
