import Link from "next/link";
import PageHeading from "@/components/PageHeading";
import { BASE_URL, UPLOADS_URL, SITE_URL } from "@/lib/api";
import "@/styles/Faq.css";

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
      {items.length === 0 ? (
        <p className="announce-empty">No announcements yet.</p>
      ) : (
        <div className="announce-list">
          {items.map((n) => {
            const inner = (
              <>
                {n.image && (
                  <img
                    src={`${UPLOADS_URL}/${n.image}`}
                    alt={n.title}
                    className="announce-img"
                    loading="lazy"
                  />
                )}
                <div className="announce-body">
                  <h2>{n.title}</h2>
                  <p>{n.message}</p>
                  <span className="announce-date">
                    {new Date(n.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </>
            );
            return (
              <div key={n._id} className="announce-card">
                {n.url ? (
                  <Link href={n.url} className="announce-card-link">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
