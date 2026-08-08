import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { Footer } from "@/components/Footer";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { UI_ASSETS } from "@/lib/ui-assets";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.cowinmotors.com"),
  title: {
    default: "Cowinmotors Automotive Parts | Sourcing & Export Partner",
    template: "%s | Cowinmotors Automotive Parts",
  },
  description:
    "China-based automotive parts sourcing and export support for fitment-led inquiries covering lighting, exhaust systems, forged wheels, and exterior parts.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "Cowinmotors Automotive Parts",
    title: "Cowinmotors Automotive Parts | Sourcing & Export Partner",
    description:
      "China-based automotive parts sourcing and export support for fitment-led inquiries.",
    url: "https://www.cowinmotors.com",
    images: [{ url: UI_ASSETS.newsLighting, width: 1200, height: 900, alt: "Cowinmotors automotive lighting and parts" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cowinmotors Automotive Parts | Sourcing & Export Partner",
    description:
      "China-based automotive parts sourcing and export support for fitment-led inquiries.",
    images: [UI_ASSETS.newsLighting],
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
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
    name: "Cowinmotors Automotive Parts",
    legalName: "Quzhou Qiying Import & Export Co., Ltd.",
    url: "https://www.cowinmotors.com",
    logo: `https://www.cowinmotors.com${UI_ASSETS.logo}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Room 110, 1st Floor, Building 1, Qushidai Future Building, Kecheng District",
      addressLocality: "Quzhou",
      addressRegion: "Zhejiang",
      addressCountry: "CN",
    },
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
