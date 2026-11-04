import JoinForm from "@/components/JoinForm";
import PageHeading from "@/components/PageHeading";
import BackButton from "@/components/BackButton";
import Breadcrumbs from "@/components/Breadcrumbs";
import SeoJsonLd from "@/components/SeoJsonLd";
import { BASE_URL, SITE_URL } from "@/lib/api";
import { buildBreadcrumbList, buildWebPageJsonLd } from "@/lib/seo";
import "@/styles/JoinRequest.css";
import "@/styles/SeoExtras.css";

async function safeList(path) {
  try {
    const res = await fetch(`${BASE_URL}/${path}`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default async function JoinPage() {
  const [categories, locations] = await Promise.all([
    safeList("categories"),
    safeList("locations"),
  ]);

  const url = `${SITE_URL}/join`;
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Join", href: "/join" },
  ];
  const breadcrumbs = buildBreadcrumbList([
    { name: "Home", url: SITE_URL },
    { name: "Join OneMind Market", url },
  ]);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      buildWebPageJsonLd({
        url,
        name: "Join OneMind Market",
        description:
          "Join OneMind Market and submit your local business to a trusted entrepreneur and business discovery network.",
        breadcrumbs,
      }),
      breadcrumbs ? { ...breadcrumbs, "@id": `${url}#breadcrumb` } : null,
    ].filter(Boolean),
  };

  return (
    <div className="joinreq-page">
      <SeoJsonLd data={jsonLd} />
      <Breadcrumbs items={crumbs} />
      <PageHeading
        eyebrow="Join Us"
        title="Join One Mind Market"
        subtitle="Become part of a trusted local business ecosystem"
      />
      <p className="join-intro">
        OneMind Market is a business network created for native entrepreneurs.
        Share your details and our team will contact you to list your business
        in the member directory.
      </p>
      <div className="joinreq-back">
        <BackButton fallback="/" />
      </div>
      <JoinForm initialCategories={categories} initialLocations={locations} />
      <section className="join-benefits">
        <h2>Why join OneMind Market</h2>
        <ul>
          <li>Get a business profile that people can find through search</li>
          <li>Receive genuine business referrals from fellow entrepreneurs</li>
          <li>
            Learn from knowledge-sharing sessions with local business owners
          </li>
          <li>Show your photos, contact details and services in one place</li>
        </ul>
      </section>
    </div>
  );
}
