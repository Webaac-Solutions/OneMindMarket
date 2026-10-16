import { notFound } from "next/navigation";
import BackButton from "@/components/BackButton";
import GalleryDetailSlider from "@/components/GalleryDetailSlider";
import SeoJsonLd from "@/components/SeoJsonLd";
import { BASE_URL, SITE_URL } from "@/lib/api";
import {
  absoluteAssetUrl,
  buildBreadcrumbList,
  buildWebPageJsonLd,
  cleanText,
  truncate,
} from "@/lib/seo";
import "@/styles/Gallery.css";

function extractYoutubeId(url) {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  );
  return match ? match[1] : null;
}

async function getGalleryItem(slug) {
  try {
    const res = await fetch(
      `${BASE_URL}/gallery/slug/${encodeURIComponent(slug)}`,
      {
        cache: "no-store",
      },
    );
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

function getOgImage(media) {
  const firstImage = media.find((m) => m.type === "image");
  if (firstImage) return absoluteAssetUrl(firstImage.url, { thumbnail: true });
  const firstYt = media.find((m) => m.type === "youtube");
  if (firstYt) {
    const ytId = extractYoutubeId(firstYt.url);
    if (ytId) return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  }
  return `${SITE_URL}/onemindlogo.png`;
}

export async function generateMetadata({ params }) {
  const item = await getGalleryItem(params.slug);
  if (!item) {
    return {
      title: "Gallery item not found",
      robots: { index: false, follow: false },
    };
  }

  const media =
    item.media && item.media.length > 0
      ? item.media
      : (item.images || []).map((img) => ({ type: "image", url: img }));
  const ogImage = getOgImage(media);
  const canonicalUrl = `${SITE_URL}/gallery/${item.slug}`;
  const description = truncate(
    item.caption || `${item.title} on OneMind Market.`,
    160,
  );

  return {
    title: `Gallery: ${item.title}`,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${item.title} | OneMind Market Gallery`,
      description,
      url: canonicalUrl,
      siteName: "OneMind Market",
      locale: "en_IN",
      type: "website",
      images: [{ url: ogImage, alt: `${item.title} gallery image` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${item.title} | OneMind Market Gallery`,
      description,
      images: [ogImage],
    },
  };
}

export default async function GalleryDetailPage({ params }) {
  const item = await getGalleryItem(params.slug);
  if (!item) notFound();

  const media =
    item.media && item.media.length > 0
      ? item.media
      : (item.images || []).map((img) => ({ type: "image", url: img }));
  const canonicalUrl = `${SITE_URL}/gallery/${item.slug}`;
  const description = truncate(
    item.caption || `${item.title} on OneMind Market.`,
    500,
  );
  const breadcrumbs = buildBreadcrumbList([
    { name: "Home", url: SITE_URL },
    { name: "Gallery", url: `${SITE_URL}/gallery` },
    { name: item.title, url: canonicalUrl },
  ]);
  const imageUrls = media
    .filter((entry) => entry?.type === "image" && entry.url)
    .map((entry) => absoluteAssetUrl(entry.url));

  const galleryPageJsonLd = buildWebPageJsonLd({
    url: canonicalUrl,
    name: item.title,
    description,
    type: "WebPage",
    image: imageUrls[0],
    breadcrumbs,
  });

  const imageObjects = imageUrls.slice(0, 20).map((url, index) => ({
    "@type": "ImageObject",
    "@id": `${canonicalUrl}#image-${index + 1}`,
    url,
    contentUrl: url,
    name: `${cleanText(item.title)} - gallery image ${index + 1}`,
    description: truncate(item.caption || item.title, 300),
  }));

  const pageJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      galleryPageJsonLd,
      ...imageObjects,
      breadcrumbs
        ? { ...breadcrumbs, "@id": `${canonicalUrl}#breadcrumb` }
        : null,
    ].filter(Boolean),
  };

  return (
    <div className="gallery-page">
      <SeoJsonLd data={pageJsonLd} />

      <div className="gallery-detail-container">
        <BackButton fallback="/gallery" />

        {media.length > 0 && (
          <GalleryDetailSlider media={media} title={item.title} />
        )}

        <h1 className="gallery-detail-title">{item.title}</h1>

        {item.caption && (
          <p className="gallery-detail-caption">{item.caption}</p>
        )}

        {item.website && /^https?:\/\//i.test(item.website) && (
          <a
            href={item.website}
            target="_blank"
            rel="noopener noreferrer"
            className="gallery-back-link"
          >
            Visit Website &#8599;
          </a>
        )}

        {item.tags && item.tags.length > 0 && (
          <div className="gallery-detail-tags">
            {item.tags.map((tag, i) => (
              <span key={i} className="gallery-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
