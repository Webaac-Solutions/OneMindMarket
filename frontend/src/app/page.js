import HomeClient from "@/components/HomeClient";
import { BASE_URL, SITE_URL } from "@/lib/api";
import SeoJsonLd from "@/components/SeoJsonLd";

async function safeJson(url) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export const metadata = {
  title: "Local Business Directory & Search in Vellore",
  description:
    "Find trusted local businesses, entrepreneurs, and services in Vellore and surrounding areas with OneMind Market's referral-driven business directory.",
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: "Local Business Directory & Search in Vellore | OneMind Market",
    description:
      "Find trusted local businesses, entrepreneurs, and services in Vellore and surrounding areas with OneMind Market.",
    url: SITE_URL,
    type: "website",
    siteName: "OneMind Market",
    locale: "en_IN",
    images: [
      { url: `${SITE_URL}/onemindlogo.png`, alt: "OneMind Market logo" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Local Business Directory & Search in Vellore | OneMind Market",
    description:
      "Find trusted local businesses, entrepreneurs, and services in Vellore and surrounding areas with OneMind Market.",
    images: [`${SITE_URL}/onemindlogo.png`],
  },
};

const homeJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${SITE_URL}#webpage`,
  url: SITE_URL,
  name: "Local Business Directory & Search in Vellore",
  description:
    "Find trusted local businesses, entrepreneurs, and services in Vellore and surrounding areas.",
  inLanguage: "en-IN",
  isPartOf: { "@id": `${SITE_URL}#website` },
  about: { "@id": `${SITE_URL}#organization` },
};

export default async function Page() {
  // Fetched server-side so the search dropdowns and Browse by Category/City
  // links render with real content for crawlers instead of an empty shell.
  const [categories, popularCategories, locations] = await Promise.all([
    safeJson(`${BASE_URL}/categories`),
    safeJson(`${BASE_URL}/categories/popular`),
    safeJson(`${BASE_URL}/locations`),
  ]);

  return (
    <>
      <SeoJsonLd data={homeJsonLd} />
      <HomeClient
        initialCategories={categories}
        initialPopularCategories={popularCategories}
        initialLocations={locations}
      />
    </>
  );
}
