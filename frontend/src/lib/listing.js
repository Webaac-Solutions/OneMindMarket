import { BASE_URL, SITE_URL } from "@/lib/api";
import { truncate } from "@/lib/seo";

export async function fetchLocationBySlug(slug) {
  if (!slug) return null;
  const res = await fetch(
    `${BASE_URL}/locations/slug/${encodeURIComponent(slug)}`,
    { cache: "no-store" },
  );
  if (!res.ok) return null;
  return res.json();
}

export async function fetchCategoryBySlug(slug) {
  if (!slug) return null;
  const res = await fetch(
    `${BASE_URL}/categories/slug/${encodeURIComponent(slug)}`,
    { cache: "no-store" },
  );
  if (!res.ok) return null;
  return res.json();
}

export async function fetchCustomers({
  locationId,
  categoryId,
  page = 1,
  limit = 20,
} = {}) {
  const url = new URL(`${BASE_URL}/customers`);
  if (locationId) url.searchParams.append("location", locationId);
  if (categoryId) url.searchParams.append("category", categoryId);
  url.searchParams.append("page", page);
  url.searchParams.append("limit", limit);

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return { results: [], total: 0, page: 1, totalPages: 1 };
  return res.json();
}

// Admin-picked "One Mind Approved" businesses, shown on the homepage.
export async function fetchFeaturedCustomers(limit = 8) {
  const url = new URL(`${BASE_URL}/customers`);
  url.searchParams.append("featured", "true");
  url.searchParams.append("page", 1);
  url.searchParams.append("limit", limit);

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.results || [];
}

export async function fetchPopularCategories() {
  const res = await fetch(`${BASE_URL}/categories/popular`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

export function locationListingMetadata(location, isEmpty = false) {
  const canonicalUrl = `${SITE_URL}/${location.slug}`;
  const title = `Local Businesses in ${location.name}`;
  const description = truncate(
    `Browse trusted local businesses, entrepreneurs, products, and services in ${location.name} on OneMind Market. Explore business profiles, contact details, photos, and categories.`,
    160,
  );
  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    ...(isEmpty
      ? {
          robots: {
            index: false,
            follow: true,
            googleBot: { index: false, follow: true },
          },
        }
      : {}),
    openGraph: {
      title: `${title} | OneMind Market`,
      description,
      url: canonicalUrl,
      type: "website",
      siteName: "OneMind Market",
      locale: "en_IN",
      images: [
        {
          url: `${SITE_URL}/onemindlogo.png`,
          alt: "OneMind Market logo",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | OneMind Market`,
      description,
      images: [`${SITE_URL}/onemindlogo.png`],
    },
  };
}

export function categoryListingMetadata(location, category, isEmpty = false) {
  const canonicalUrl = `${SITE_URL}/${location.slug}/${category.slug}`;
  const title = `${category.name} in ${location.name}`;
  const description = truncate(
    `Find trusted ${category.name} businesses and services in ${location.name} on OneMind Market. Browse local business profiles, photos, contact information, and related businesses.`,
    160,
  );
  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    ...(isEmpty
      ? {
          robots: {
            index: false,
            follow: true,
            googleBot: { index: false, follow: true },
          },
        }
      : {}),
    openGraph: {
      title: `${title} | OneMind Market`,
      description,
      url: canonicalUrl,
      type: "website",
      siteName: "OneMind Market",
      locale: "en_IN",
      images: [
        {
          url: `${SITE_URL}/onemindlogo.png`,
          alt: "OneMind Market logo",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | OneMind Market`,
      description,
      images: [`${SITE_URL}/onemindlogo.png`],
    },
  };
}
