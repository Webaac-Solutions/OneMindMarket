import PageHeading from "@/components/PageHeading";
import AnnouncementsClient from "@/components/AnnouncementsClient";
import { BASE_URL, UPLOADS_URL, SITE_URL } from "@/lib/api";
import "@/styles/Announcements.css";

export const metadata = {
  title: "Announcements",
  description:
    "Latest announcements and updates from OneMind Market and the member network.",
  alternates: { canonical: `${SITE_URL}/announcements` },
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

  return (
    <div className="announce-page">
      <PageHeading
        eyebrow="Updates"
        title="Announcements"
        subtitle="News and updates from the OneMind Market network"
      />
      <AnnouncementsClient items={items} uploadsUrl={UPLOADS_URL} />
    </div>
  );
}
