import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import BusinessListingClient from "@/components/BusinessListingClient";
import SeoJsonLd from "@/components/SeoJsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import Pagination from "@/components/Pagination";
import { BASE_URL, SITE_URL } from "@/lib/api";
import {
  fetchLocationBySlug,
  fetchLocations,
  fetchCategories,
  fetchCustomers,
  locationListingMetadata,
  parsePage,
} from "@/lib/listing";
import { buildBreadcrumbList, buildBusinessListJsonLd } from "@/lib/seo";

const PAGE_SIZE = 24;

const RESERVED_SLUGS = new Set([
  "about",
  "announcements",
  "articles",
  "business",
  "business-listing",
  "enquiry",
  // "faq", // FAQ-OFF: uncomment to restore
  "gallery",
  "join",
  "privacy",
  "search",
  "shop",
  "terms",
  "api",
  "favicon.ico",
]);

async function fetchLocationCategories(locationId) {
  try {
    const res = await fetch(`${BASE_URL}/locations/${locationId}/categories`, {
      next: { revalidate: 60 },
    });
    return res.ok ? await res.json() : [];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params, searchParams }) {
  if (RESERVED_SLUGS.has(params.locationSlug)) return {};
  const location = await fetchLocationBySlug(params.locationSlug);
  if (!location) {
    return {
      title: "Location not found",
      robots: { index: false, follow: false },
    };
  }
  const page = parsePage(searchParams?.page);
  const { total } = await fetchCustomers({
    locationId: location._id,
    page: 1,
    limit: 1,
  });
  return locationListingMetadata(location, total === 0, page);
}

export default async function LocationListingPage({ params, searchParams }) {
  if (RESERVED_SLUGS.has(params.locationSlug)) notFound();

  const location = await fetchLocationBySlug(params.locationSlug);
  if (!location) notFound();

  const page = parsePage(searchParams?.page);

  const [
    { results, total, totalPages },
    categories,
    allLocations,
    allCategories,
  ] = await Promise.all([
    fetchCustomers({ locationId: location._id, page, limit: PAGE_SIZE }),
    fetchLocationCategories(location._id),
    fetchLocations(),
    fetchCategories(),
  ]);

  if (page > 1 && page > (totalPages || 1)) notFound();

  const basePath = `/${location.slug}`;
  const url = `${SITE_URL}${basePath}`;
  const crumbs = [
    { name: "Home", href: "/" },
    { name: location.name, href: basePath },
  ];
  const breadcrumbs = buildBreadcrumbList(
    crumbs.map((c) => ({
      name: c.name,
      url: c.href === "/" ? SITE_URL : `${SITE_URL}${c.href}`,
    })),
  );
  const jsonLd = buildBusinessListJsonLd({
    items: results,
    url: page > 1 ? `${url}?page=${page}` : url,
    name: `Local Businesses in ${location.name}`,
    description: `Browse trusted local businesses and entrepreneurs in ${location.name} on OneMind Market.`,
    breadcrumbs,
  });
  const otherLocations = allLocations.filter(
    (l) => l.slug && l.slug !== location.slug,
  );

  return (
    <div className="sr-page">
      <SeoJsonLd data={jsonLd} />
      <Breadcrumbs items={crumbs} />
      <Suspense fallback={null}>
        <BusinessListingClient
          fixed={{
            location: location.slug,
            title: `Local Businesses in ${location.name}${page > 1 ? ` - Page ${page}` : ""}`,
            subtitle:
              total > 0
                ? `OneMind Market lists ${total} local ${total === 1 ? "business" : "businesses"} in ${location.name}${categories.length > 0 ? ` across ${categories.length} ${categories.length === 1 ? "category" : "categories"}` : ""}, including verified contact details, photos, and profiles for each entrepreneur and service provider.`
                : undefined,
          }}
          initialData={{
            locations: allLocations,
            categories: allCategories,
            popularCategories: [],
            categoriesInLocation: categories,
            q: "",
            initialResults: results,
            initialTotal: total,
            initialTotalPages: 1,
          }}
        />
      </Suspense>

      {categories.length > 0 && (
        <div className="seo-links">
          <h2>Browse {location.name} by category</h2>
          <ul>
            {categories
              .filter((c) => c.slug)
              .map((c) => (
                <li key={c._id}>
                  <Link href={`/${location.slug}/${c.slug}`}>
                    {c.name} in {location.name}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      )}

      <Pagination basePath={basePath} page={page} totalPages={totalPages} />

      {otherLocations.length > 0 && (
        <div className="seo-links">
          <h2>Explore other areas</h2>
          <ul>
            {otherLocations.map((l) => (
              <li key={l._id}>
                <Link href={`/${l.slug}`}>Businesses in {l.name}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
