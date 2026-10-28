import { Suspense } from "react";
import BusinessListingClient from "@/components/BusinessListingClient";
import SeoJsonLd from "@/components/SeoJsonLd";
import { BASE_URL, SITE_URL } from "@/lib/api";
import {
  buildBreadcrumbList,
  buildBusinessListJsonLd,
  buildKeywords,
  truncate,
} from "@/lib/seo";

async function safeJson(url) {
  try {
    const res = await fetch(url, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Resolve a location/category param (which may already be a slug, an
// ObjectId, or empty) down to its Mongo _id, for filtering /customers.
async function resolveId(kind, value) {
  if (!value) return "";
  if (/^[0-9a-fA-F]{24}$/.test(value)) return value;
  const doc = await safeJson(
    `${BASE_URL}/${kind}/slug/${encodeURIComponent(value)}`,
  );
  return doc?._id || "";
}

async function loadPageData(searchParams) {
  const categoryParam = searchParams?.category || "";
  const locationParam = searchParams?.location || "";
  const q = searchParams?.q || "";

  const [locations, categories, popularCategories] = await Promise.all([
    safeJson(`${BASE_URL}/locations`).then((d) => d || []),
    safeJson(`${BASE_URL}/categories`).then((d) => d || []),
    safeJson(`${BASE_URL}/categories/popular`).then((d) => d || []),
  ]);

  const [categoryId, locationId] = await Promise.all([
    resolveId("categories", categoryParam),
    resolveId("locations", locationParam),
  ]);

  const categoriesInLocation = locationId
    ? await safeJson(`${BASE_URL}/locations/${locationId}/categories`).then(
        (d) => d || [],
      )
    : [];

  const customersUrl = new URL(`${BASE_URL}/customers`);
  if (categoryId) customersUrl.searchParams.append("category", categoryId);
  if (locationId) customersUrl.searchParams.append("location", locationId);
  if (q) customersUrl.searchParams.append("q", q);
  customersUrl.searchParams.append("page", 1);
  customersUrl.searchParams.append("limit", 12);

  const customersData = (await safeJson(customersUrl.toString())) || {
    results: [],
    total: 0,
    totalPages: 1,
  };

  const locationObj = locationId
    ? locations.find((l) => l._id === locationId)
    : null;
  const categoryObj = categoryId
    ? categories.find((c) => c._id === categoryId)
    : null;

  return {
    locations,
    categories,
    popularCategories,
    categoriesInLocation,
    locationObj,
    categoryObj,
    q,
    initialResults: customersData.results || [],
    initialTotal: customersData.total || 0,
    initialTotalPages: customersData.totalPages || 1,
  };
}

export async function generateMetadata({ searchParams }) {
  const isFiltered = Boolean(
    searchParams?.category || searchParams?.location || searchParams?.q,
  );
  const { locationObj, categoryObj, categories, locations } =
    await loadPageData(searchParams);

  const titleParts = [
    categoryObj?.name,
    locationObj?.name ? `in ${locationObj.name}` : null,
  ].filter(Boolean);
  const title = titleParts.length
    ? `${titleParts.join(" ")} | Business Listing`
    : "Business Listing - Local Members & Businesses";

  const topCategories = categories.slice(0, 4).map((c) => c.name);
  const topLocations = locations.slice(0, 3).map((l) => l.name);
  const description = truncate(
    isFiltered || !topCategories.length
      ? `Browse ${categoryObj?.name || "all"} businesses${locationObj?.name ? ` in ${locationObj.name}` : ""} on OneMind Market - trusted local entrepreneurs, contact details, and profiles.`
      : `Browse OneMind Market member businesses${topLocations.length ? ` in ${topLocations.join(", ")}` : ""} - ${topCategories.join(", ")} and more. Call, WhatsApp, or send an enquiry.`,
    160,
  );

  const keywords = buildKeywords([
    categoryObj?.name && locationObj?.name
      ? `${categoryObj.name} in ${locationObj.name}`
      : null,
    categoryObj?.name,
    locationObj?.name ? `businesses in ${locationObj.name}` : null,
    "business listing",
    "local business directory",
    "OneMind Market members",
    "trusted local businesses",
    "local entrepreneurs",
    "business contact details",
    ...categories.slice(0, 10).map((c) => c.name),
    ...locations.slice(0, 5).map((l) => `businesses in ${l.name}`),
  ]);

  return {
    title,
    description,
    keywords,
    alternates: { canonical: `${SITE_URL}/business-listing` },
    openGraph: {
      title: `${title} | OneMind Market`,
      description,
      url: `${SITE_URL}/business-listing`,
      type: "website",
      siteName: "OneMind Market",
      locale: "en_IN",
    },
    // Filtered query-string views are near-duplicates of the dedicated
    // /{location}/{category} pages, so keep only the unfiltered hub indexed.
    ...(isFiltered ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function BusinessListingPage({ searchParams }) {
  const data = await loadPageData(searchParams);

  const url = `${SITE_URL}/business-listing`;
  const breadcrumbs = buildBreadcrumbList([
    { name: "Home", url: SITE_URL },
    { name: "Business Listing", url },
  ]);
  const jsonLd = buildBusinessListJsonLd({
    items: data.initialResults,
    url,
    name: "Business Listing",
    description:
      "Browse every business on OneMind Market by location and category.",
    breadcrumbs,
  });

  return (
    <Suspense fallback={null}>
      <SeoJsonLd data={jsonLd} />
      <BusinessListingClient initialData={data} />
    </Suspense>
  );
}
