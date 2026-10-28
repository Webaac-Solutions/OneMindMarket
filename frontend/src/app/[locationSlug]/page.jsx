import { notFound } from "next/navigation";
import Link from "next/link";
import ListingGrid from "@/components/ListingGrid";
import SeoJsonLd from "@/components/SeoJsonLd";
import BackButton from "@/components/BackButton";
import { BASE_URL, SITE_URL } from "@/lib/api";
import {
  fetchLocationBySlug,
  fetchCustomers,
  locationListingMetadata,
} from "@/lib/listing";
import { buildBreadcrumbList, buildBusinessListJsonLd } from "@/lib/seo";

const RESERVED_SLUGS = new Set([
  "about",
  "articles",
  "business",
  "enquiry",
  "gallery",
  "join",
  "search",
  "shop",
  "api",
  "favicon.ico",
]);

export async function generateMetadata({ params }) {
  if (RESERVED_SLUGS.has(params.locationSlug)) return {};
  const location = await fetchLocationBySlug(params.locationSlug);
  if (!location) {
    return {
      title: "Location not found",
      robots: { index: false, follow: false },
    };
  }
  return locationListingMetadata(location);
}

export default async function LocationListingPage({ params }) {
  if (RESERVED_SLUGS.has(params.locationSlug)) notFound();

  const location = await fetchLocationBySlug(params.locationSlug);
  if (!location) notFound();

  const [{ results, total }, categoriesRes] = await Promise.all([
    fetchCustomers({ locationId: location._id, page: 1, limit: 24 }),
    fetch(`${BASE_URL}/locations/${location._id}/categories`, {
      next: { revalidate: 60 },
    })
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []),
  ]);

  const url = `${SITE_URL}/${location.slug}`;
  const breadcrumbs = buildBreadcrumbList([
    { name: "Home", url: SITE_URL },
    { name: location.name, url },
  ]);
  const jsonLd = buildBusinessListJsonLd({
    items: results,
    url,
    name: `Local Businesses in ${location.name}`,
    description: `Browse trusted local businesses and entrepreneurs in ${location.name} on OneMind Market.`,
    breadcrumbs,
  });

  return (
    <div className="sr-page">
      <SeoJsonLd data={jsonLd} />
      <BackButton fallback="/" />

      <div className="sr-search-bar-wrap">
        <h1 style={{ margin: 0 }}>Local Businesses in {location.name}</h1>
      </div>

      {total > 0 && (
        <p className="search-hint">
          OneMind Market lists {total} local{" "}
          {total === 1 ? "business" : "businesses"} in {location.name}
          {categoriesRes.length > 0
            ? ` across ${categoriesRes.length} ${categoriesRes.length === 1 ? "category" : "categories"}`
            : ""}
          , including verified contact details, photos, and profiles for each
          entrepreneur and service provider.
        </p>
      )}

      {categoriesRes.length > 0 && (
        <p className="search-hint">
          Browse by category:{" "}
          {categoriesRes.map((c, i) => (
            <span key={c._id}>
              <Link href={`/${location.slug}/${c.slug || ""}`}>{c.name}</Link>
              {i < categoriesRes.length - 1 ? ", " : ""}
            </span>
          ))}
        </p>
      )}

      <ListingGrid
        results={results}
        emptyMessage={`No businesses in ${location.name} yet.`}
      />
    </div>
  );
}
