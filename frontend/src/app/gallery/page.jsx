import GalleryClient from "@/components/GalleryClient";
import SeoJsonLd from "@/components/SeoJsonLd";
import { BASE_URL, SITE_URL } from "@/lib/api";
import {
  absoluteAssetUrl,
  buildBreadcrumbList,
  buildWebPageJsonLd,
} from "@/lib/seo";

export const metadata = {
  title: "Business & Community Gallery",
  description:
    "Explore photos, videos, and community highlights from OneMind Market's local business network.",
  alternates: { canonical: `${SITE_URL}/gallery` },
  openGraph: {
    title: "Business & Community Gallery | OneMind Market",
    description:
      "Explore photos, videos, and community highlights from OneMind Market's local business network.",
    url: `${SITE_URL}/gallery`,
    type: "website",
    siteName: "OneMind Market",
    locale: "en_IN",
    images: [
      { url: `${SITE_URL}/onemindlogo.png`, alt: "OneMind Market logo" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Business & Community Gallery | OneMind Market",
    description:
      "Explore photos, videos, and community highlights from OneMind Market's local business network.",
    images: [`${SITE_URL}/onemindlogo.png`],
  },
};

async function getGalleryItems() {
  try {
    const res = await fetch(`${BASE_URL}/gallery`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data.filter((item) => item?.slug) : [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

function getFirstImage(item) {
  const media =
    item.media && item.media.length > 0
      ? item.media
      : (item.images || []).map((url) => ({ type: "image", url }));
  const firstImage = media.find(
    (entry) => entry?.type === "image" && entry.url,
  );
  return firstImage ? absoluteAssetUrl(firstImage.url) : null;
}

export default async function GalleryPage() {
  const items = await getGalleryItems();
  const url = `${SITE_URL}/gallery`;
  const breadcrumbs = buildBreadcrumbList([
    { name: "Home", url: SITE_URL },
    { name: "Gallery", url },
  ]);
  const itemList = {
    "@type": "ItemList",
    "@id": `${url}#gallery-list`,
    name: "OneMind Market Gallery",
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => {
      const itemUrl = `${url}/${item.slug}`;
      const image = getFirstImage(item);
      return {
        "@type": "ListItem",
        position: index + 1,
        url: itemUrl,
        item: {
          "@type": "CreativeWork",
          name: item.title,
          url: itemUrl,
          ...(item.caption ? { description: item.caption } : {}),
          ...(image ? { image } : {}),
        },
      };
    }),
  };
  const pageJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      buildWebPageJsonLd({
        url,
        name: metadata.title,
        description: metadata.description,
        type: "CollectionPage",
        breadcrumbs,
        mainEntity: { "@id": `${url}#gallery-list` },
      }),
      itemList,
      breadcrumbs ? { ...breadcrumbs, "@id": `${url}#breadcrumb` } : null,
    ].filter(Boolean),
  };

  return (
    <>
      <SeoJsonLd data={pageJsonLd} />
      <GalleryClient items={items} />
    </>
  );
}
