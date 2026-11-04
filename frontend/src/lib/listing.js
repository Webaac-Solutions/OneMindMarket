import { BASE_URL, SITE_URL } from "@/lib/api";
import { truncate } from "@/lib/seo";

export async function fetchLocationBySlug(slug) {
  if (!slug) return null;
  const res = await fetch(
    `${BASE_URL}/locations/slug/${encodeURIComponent(slug)}`,
    { next: { revalidate: 60 } },
  );
  if (!res.ok) return null;
  return res.json();
}

export async function fetchCategoryBySlug(slug) {
  if (!slug) return null;
  const res = await fetch(
    `${BASE_URL}/categories/slug/${encodeURIComponent(slug)}`,
    { next: { revalidate: 60 } },
  );
  if (!res.ok) return null;
  return res.json();
}

export async function fetchLocations() {
  try {
    const res = await fetch(`${BASE_URL}/locations`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function fetchCategories() {
  try {
    const res = await fetch(`${BASE_URL}/categories`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function parsePage(value) {
  const n = parseInt(Array.isArray(value) ? value[0] : value, 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
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

  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) return { results: [], total: 0, page: 1, totalPages: 1 };
  return res.json();
}

// Admin-picked "One Mind Approved" businesses, shown on the homepage.
export async function fetchFeaturedCustomers(limit = 8) {
  const url = new URL(`${BASE_URL}/customers`);
  url.searchParams.append("featured", "true");
  url.searchParams.append("page", 1);
  url.searchParams.append("limit", limit);

  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) return [];
  const data = await res.json();
  return data.results || [];
}

export async function fetchPopularCategories() {
  const res = await fetch(`${BASE_URL}/categories/popular`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return [];
  return res.json();
}

export function locationListingMetadata(location, isEmpty = false, page = 1) {
  const basePath = `${SITE_URL}/${location.slug}`;
  const canonicalUrl = page > 1 ? `${basePath}?page=${page}` : basePath;
  const title = `Local Businesses in ${location.name}${page > 1 ? ` - Page ${page}` : ""}`;
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

export function categoryListingMetadata(
  location,
  category,
  isEmpty = false,
  page = 1,
) {
  const basePath = `${SITE_URL}/${location.slug}/${category.slug}`;
  const canonicalUrl = page > 1 ? `${basePath}?page=${page}` : basePath;
  const title = `${category.name} in ${location.name}${page > 1 ? ` - Page ${page}` : ""}`;
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
