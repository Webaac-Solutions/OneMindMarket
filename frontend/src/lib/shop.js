import { BASE_URL, SERVER_URL, SITE_URL } from "@/lib/api";
import { truncate } from "@/lib/seo";

const isObjectId = (s) => /^[0-9a-fA-F]{24}$/.test(s);

export async function fetchShopBySlug(effectiveSlug) {
  if (!effectiveSlug) return null;

  let customer = null;
  if (isObjectId(effectiveSlug)) {
    const res = await fetch(`${BASE_URL}/customers/${effectiveSlug}`, { cache: "no-store" });
    if (res.ok) customer = await res.json();
  } else {
    const res = await fetch(
      `${BASE_URL}/customers/slug/${encodeURIComponent(effectiveSlug)}`,
      { cache: "no-store" },
    );
    if (res.ok) customer = await res.json();
  }
  return customer;
}

export async function fetchShopPhotos(customerId) {
  const base = `${BASE_URL}/customers/${customerId}/photos`;
  const [g1, g2, g3] = await Promise.all([
    fetch(`${base}?group=1`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : [])).catch(() => []),
    fetch(`${base}?group=2`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : [])).catch(() => []),
    fetch(`${base}?group=3`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : [])).catch(() => []),
  ]);
  return {
    photos1: Array.isArray(g1) ? g1 : [],
    photos2: Array.isArray(g2) ? g2 : [],
    photos3: Array.isArray(g3) ? g3 : [],
  };
}

export function canonicalShopPath(shop) {
  const locSlug = shop.location?.slug || "unknown";
  const catSlug = shop.category?.slug || "uncategorized";
  return `/${locSlug}/${catSlug}/${shop.slug}`;
}

export function shopMetadata(shop) {
  const canonicalUrl = `${SITE_URL}${canonicalShopPath(shop)}`;
  const locationName = shop.location?.name || "";
  const categoryName = shop.category?.name || "Local Business";
  const title = categoryName && locationName
    ? `${shop.shopName} - ${categoryName} in ${locationName}`
    : shop.shopName;
  const description = truncate(
    shop.shopDescription ||
      `${shop.shopName} is listed on OneMind Market. Find photos, contact details, location, category, and business information.`,
    160,
  );
  const ogImage = shop.shopPhoto
    ? `${SERVER_URL}/uploads/thumb/${shop.shopPhoto}`
    : `${SITE_URL}/onemindlogo.png`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${title} | OneMind Market`,
      description,
      url: canonicalUrl,
      type: "website",
      siteName: "OneMind Market",
      locale: "en_IN",
      images: [
        {
          url: ogImage,
          alt: `${shop.shopName}${categoryName ? ` - ${categoryName}` : ""}${locationName ? ` in ${locationName}` : ""}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | OneMind Market`,
      description,
      images: [ogImage],
    },
  };
}
