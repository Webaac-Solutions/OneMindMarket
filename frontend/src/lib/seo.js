import { SITE_URL, UPLOADS_URL, SERVER_URL } from "@/lib/api";

const SITE_NAME = "OneMind Market";
const DEFAULT_LOCALE = "en-IN";
const DEFAULT_LOGO = `${SITE_URL}/onemindlogo.png`;

export function cleanText(value = "") {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncate(text, maxLength = 160) {
  const value = cleanText(text);
  if (!value) return "";
  if (value.length <= maxLength) return value;

  const shortened = value
    .slice(0, maxLength - 1)
    .replace(/\s+\S*$/, "")
    .trim();
  return `${shortened || value.slice(0, maxLength - 1).trim()}…`;
}

export function buildKeywords(list = [], max = 20) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const value = cleanText(item);
    const key = value.toLowerCase();
    if (!value || seen.has(key)) continue;
    seen.add(key);
    out.push(value);
    if (out.length >= max) break;
  }
  return out;
}

export function topByFrequency(values = [], limit = 8) {
  const counts = new Map();
  for (const raw of values) {
    const value = cleanText(raw);
    if (!value) continue;
    const key = value.toLowerCase();
    const entry = counts.get(key) || { value, count: 0 };
    entry.count += 1;
    counts.set(key, entry);
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((entry) => entry.value);
}

export function canonicalUrl(pathname = "/") {
  if (!pathname || pathname === "/") return SITE_URL;
  return `${SITE_URL}/${String(pathname).replace(/^\/+|\/+$/g, "")}`;
}

export function absoluteAssetUrl(filename, { thumbnail = false } = {}) {
  if (!filename) return null;
  const value = String(filename).trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;

  const base = thumbnail ? `${SERVER_URL}/uploads/thumb` : UPLOADS_URL;
  return `${base}/${value.replace(/^\/+/, "")}`;
}

export function pageMetadata({
  title,
  description,
  url,
  image = DEFAULT_LOGO,
  imageAlt = `${SITE_NAME} logo`,
  type = "website",
  publishedTime,
  modifiedTime,
  section,
  tags,
} = {}) {
  const safeTitle = cleanText(title) || SITE_NAME;
  const safeDescription =
    truncate(description, 160) ||
    "Discover trusted local businesses, entrepreneurs, articles, and community content on OneMind Market.";
  const safeUrl = url || SITE_URL;

  const images = image
    ? [
        {
          url: image,
          alt: imageAlt,
        },
      ]
    : undefined;

  const openGraph = {
    title: `${safeTitle} | ${SITE_NAME}`,
    description: safeDescription,
    url: safeUrl,
    siteName: SITE_NAME,
    locale: DEFAULT_LOCALE,
    type,
    images,
  };

  if (publishedTime) openGraph.publishedTime = publishedTime;
  if (modifiedTime) openGraph.modifiedTime = modifiedTime;
  if (section) openGraph.section = section;
  if (Array.isArray(tags) && tags.length > 0) openGraph.tags = tags;

  return {
    title: safeTitle,
    description: safeDescription,
    alternates: { canonical: safeUrl },
    openGraph,
    twitter: {
      card: "summary_large_image",
      title: `${safeTitle} | ${SITE_NAME}`,
      description: safeDescription,
      images: image ? [image] : undefined,
    },
  };
}

export function buildBreadcrumbList(items = []) {
  const validItems = items.filter((item) => item?.name && item?.url);
  if (validItems.length < 2) return null;

  return {
    "@type": "BreadcrumbList",
    itemListElement: validItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: cleanText(item.name),
      item: item.url,
    })),
  };
}

export function buildWebPageJsonLd({
  url,
  name,
  description,
  type = "WebPage",
  image,
  breadcrumbs,
  mainEntity,
  datePublished,
  dateModified,
} = {}) {
  const page = {
    "@type": type,
    "@id": `${url}#webpage`,
    url,
    name: cleanText(name),
    description: truncate(description, 500),
    isPartOf: {
      "@type": "WebSite",
      "@id": `${SITE_URL}#website`,
      name: SITE_NAME,
      url: SITE_URL,
    },
    inLanguage: DEFAULT_LOCALE,
  };

  if (image) page.primaryImageOfPage = { "@type": "ImageObject", url: image };
  if (breadcrumbs) page.breadcrumb = { "@id": `${url}#breadcrumb` };
  if (mainEntity) page.mainEntity = mainEntity;
  if (datePublished) page.datePublished = datePublished;
  if (dateModified) page.dateModified = dateModified;

  return page;
}

export function buildLocalBusinessJsonLd({ shop, url, imageUrls = [] } = {}) {
  if (!shop) return null;

  const images = [...new Set(imageUrls.filter(Boolean))];
  const business = {
    "@type": "LocalBusiness",
    "@id": `${url}#business`,
    name: cleanText(shop.shopName),
    url,
    description: truncate(
      shop.shopDescription ||
        shop.shopArticle ||
        `${shop.shopName} on ${SITE_NAME}.`,
      500,
    ),
  };

  if (images.length > 0) business.image = images;
  if (shop.shopPhone) business.telephone = cleanText(shop.shopPhone);
  if (shop.email) business.email = cleanText(shop.email);
  if (shop.website) {
    const website = String(shop.website).trim();
    business.sameAs = /^https?:\/\//i.test(website)
      ? [website]
      : [`https://${website}`];
  }
  if (shop.category?.name)
    business.knowsAbout = [cleanText(shop.category.name)];
  if (shop.location?.name) business.areaServed = cleanText(shop.location.name);

  const streetAddress = cleanText(shop.address);
  const locality = cleanText(shop.location?.name);
  if (streetAddress || locality) {
    business.address = {
      "@type": "PostalAddress",
      ...(streetAddress ? { streetAddress } : {}),
      ...(locality ? { addressLocality: locality } : {}),
      addressCountry: "IN",
    };
  }

  return business;
}

export function buildBusinessListJsonLd({
  items = [],
  url,
  name,
  description,
  breadcrumbs,
} = {}) {
  const listItems = items
    .filter(
      (item) =>
        item?.slug &&
        item?.shopName &&
        item?.location?.slug &&
        item?.category?.slug,
    )
    .map((item, index) => {
      const itemUrl = `${SITE_URL}/${item.location.slug}/${item.category.slug}/${item.slug}`;
      const image = absoluteAssetUrl(item.shopPhoto);
      const business = {
        "@type": "LocalBusiness",
        name: cleanText(item.shopName),
        url: itemUrl,
      };
      if (image) business.image = [image];
      if (item.category?.name)
        business.knowsAbout = [cleanText(item.category.name)];
      if (item.location?.name)
        business.areaServed = cleanText(item.location.name);
      if (item.shopDescription)
        business.description = truncate(item.shopDescription, 300);

      return {
        "@type": "ListItem",
        position: index + 1,
        url: itemUrl,
        item: business,
      };
    });

  const itemList = {
    "@type": "ItemList",
    name: cleanText(name),
    numberOfItems: listItems.length,
    itemListElement: listItems,
  };

  const graph = [
    buildWebPageJsonLd({
      url,
      name,
      description,
      type: "CollectionPage",
      breadcrumbs,
      mainEntity: { "@id": `${url}#business-list` },
    }),
    { ...itemList, "@id": `${url}#business-list` },
  ];

  return {
    "@context": "https://schema.org",
    "@graph": graph.filter(Boolean),
  };
}

export function buildSafeJsonLd(data) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export { DEFAULT_LOGO, DEFAULT_LOCALE, SITE_NAME, SITE_URL };
