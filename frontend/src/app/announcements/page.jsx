import PageHeading from "@/components/PageHeading";
import AnnouncementsClient from "@/components/Announcementsclient";
import { BASE_URL, UPLOADS_URL, SITE_URL } from "@/lib/api";
import SeoJsonLd from "@/components/SeoJsonLd";
import { buildBreadcrumbList, buildWebPageJsonLd } from "@/lib/seo";
import "@/styles/Announcements.css";

export const metadata = {
  title: "Announcements",
  description:
    "Latest announcements and updates from OneMind Market and the member network.",
  alternates: { canonical: `${SITE_URL}/announcements` },
  openGraph: {
    title: "Announcements | OneMind Market",
    description:
      "Latest announcements and updates from OneMind Market and the member network.",
    url: `${SITE_URL}/announcements`,
    type: "website",
    siteName: "OneMind Market",
    locale: "en_IN",
    images: [
      { url: `${SITE_URL}/onemindlogo.png`, alt: "OneMind Market logo" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Announcements | OneMind Market",
    description:
      "Latest announcements and updates from OneMind Market and the member network.",
    images: [`${SITE_URL}/onemindlogo.png`],
  },
};

async function getAnnouncements() {
  try {
    const res = await fetch(`${BASE_URL}/announcements?limit=50`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default async function AnnouncementsPage() {
  const items = await getAnnouncements();
  const url = `${SITE_URL}/announcements`;
  const breadcrumbs = buildBreadcrumbList([
    { name: "Home", url: SITE_URL },
    { name: "Announcements", url },
  ]);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      buildWebPageJsonLd({
        url,
        name: "Announcements",
        description: metadata.description,
        type: "CollectionPage",
        breadcrumbs,
      }),
      breadcrumbs ? { ...breadcrumbs, "@id": `${url}#breadcrumb` } : null,
    ].filter(Boolean),
  };

  return (
    <div className="announce-page">
      <SeoJsonLd data={jsonLd} />
      <PageHeading
        eyebrow="Updates"
        title="Announcements"
        subtitle="News and updates from the OneMind Market network"
      />
      <AnnouncementsClient items={items} uploadsUrl={UPLOADS_URL} />
    </div>
  );
}
