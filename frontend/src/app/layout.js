import { Inter, Carlito } from "next/font/google";
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SplashScreen from "@/components/SplashScreen";
import PageTransition from "@/components/PageTransition";
import PushPromptLazy from "@/components/PushPromptLazy";
import RouteProgress from "@/components/RouteProgress";
import SeoJsonLd from "@/components/SeoJsonLd";
import { SITE_URL } from "@/lib/api";
import { DEFAULT_LOGO, SITE_NAME } from "@/lib/seo";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const logoFont = Carlito({
  subsets: ["latin"],
  variable: "--font-logo",
  weight: ["400", "700"],
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "OneMind Market | Local Business Directory in Vellore",
    template: "%s | OneMind Market",
  },
  description:
    "OneMind Market is a local business directory and discovery platform for finding trusted businesses, entrepreneurs, services, articles, and community content in Vellore and surrounding areas.",
  applicationName: SITE_NAME,
  category: "business",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  },
  verification: { google: "yCuFDY7F2P2tLI7D9bju8c2TKHQ8nbuE-LNaAqY5zJc" },
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "OneMind Market | Local Business Directory in Vellore",
    description:
      "Discover trusted local businesses, entrepreneurs, services, articles, and community content through OneMind Market.",
    images: [
      {
        url: DEFAULT_LOGO,
        alt: `${SITE_NAME} logo`,
      },
    ],
    url: SITE_URL,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "OneMind Market | Local Business Directory in Vellore",
    description:
      "Discover trusted local businesses, entrepreneurs, services, articles, and community content through OneMind Market.",
    images: [DEFAULT_LOGO],
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}#website`,
  name: SITE_NAME,
  url: SITE_URL,
  description:
    "A local business directory and discovery platform for trusted businesses and entrepreneurs.",
  inLanguage: "en-IN",
  publisher: { "@id": `${SITE_URL}#organization` },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: DEFAULT_LOGO,
  image: DEFAULT_LOGO,
  description:
    "OneMind Market connects native entrepreneurs and helps people discover trusted local businesses and services.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Vellore",
    addressRegion: "Tamil Nadu",
    addressCountry: "IN",
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+91-9677690666",
    contactType: "customer service",
    areaServed: "IN",
  },
  sameAs: [
    "https://www.instagram.com/onemindmarket/",
    "https://x.com/OneMindMarket",
    "https://www.linkedin.com/in/one-mind-market-648538389/",
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-IN" className={`${inter.variable} ${logoFont.variable}`}>
      <head>
        <SeoJsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [websiteJsonLd, organizationJsonLd],
          }}
        />
      </head>
      <body>
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        <SplashScreen />
        <Header />
        <main>
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
        <PushPromptLazy />
      </body>
    </html>
  );
}
