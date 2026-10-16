import Image from "next/image";
import BackButton from "@/components/BackButton";
import { notFound } from "next/navigation";
import SeoJsonLd from "@/components/SeoJsonLd";
import BackToTop from "@/components/BackToTop";
import { BASE_URL, UPLOADS_URL, SITE_URL } from "@/lib/api";
import {
  absoluteAssetUrl,
  buildBreadcrumbList,
  buildKeywords,
  buildWebPageJsonLd,
  cleanText,
  truncate,
} from "@/lib/seo";
import "@/styles/Articles.css";

async function getArticle(slug) {
  try {
    const res = await fetch(
      `${BASE_URL}/articles/slug/${encodeURIComponent(slug)}`,
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

export async function generateMetadata({ params }) {
  const article = await getArticle(params.slug);
  if (!article) {
    return {
      title: "Article not found",
      robots: { index: false, follow: false },
    };
  }

  const canonicalUrl = `${SITE_URL}/articles/${article.slug}`;
  const description = truncate(
    article.excerpt || article.content || article.title,
    160,
  );
  const ogImageUrl = article.featuredImage
    ? absoluteAssetUrl(article.featuredImage, { thumbnail: true })
    : `${SITE_URL}/onemindlogo.png`;

  return {
    title: article.title,
    description,
    keywords: buildKeywords([
      ...(article.tags || []),
      article.title,
      "OneMind Market",
      "local business article",
    ]),
    alternates: { canonical: canonicalUrl },
    authors: article.author ? [{ name: cleanText(article.author) }] : undefined,
    openGraph: {
      title: `${article.title} | OneMind Market`,
      description,
      url: canonicalUrl,
      siteName: "OneMind Market",
      locale: "en_IN",
      type: "article",
      ...(article.createdAt ? { publishedTime: article.createdAt } : {}),
      ...(article.updatedAt ? { modifiedTime: article.updatedAt } : {}),
      ...(article.tags?.length ? { tags: article.tags } : {}),
      images: [
        {
          url: ogImageUrl,
          alt: `${article.title} - featured image`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${article.title} | OneMind Market`,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function ArticleDetailPage({ params }) {
  const article = await getArticle(params.slug);
  if (!article) notFound();

  const imageUrl = article.featuredImage
    ? absoluteAssetUrl(article.featuredImage)
    : null;
  const canonicalUrl = `${SITE_URL}/articles/${article.slug}`;
  const description = truncate(
    article.excerpt || article.content || article.title,
    500,
  );
  const breadcrumbs = buildBreadcrumbList([
    { name: "Home", url: SITE_URL },
    { name: "Articles", url: `${SITE_URL}/articles` },
    { name: article.title, url: canonicalUrl },
  ]);

  const articleJsonLd = {
    "@type": "Article",
    "@id": `${canonicalUrl}#article`,
    headline: cleanText(article.title),
    description,
    url: canonicalUrl,
    mainEntityOfPage: { "@id": `${canonicalUrl}#webpage` },
    inLanguage: "en-IN",
    ...(imageUrl ? { image: [imageUrl] } : {}),
    author: {
      "@type": "Person",
      name: cleanText(article.author || "OneMind Market"),
    },
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}#organization`,
      name: "OneMind Market",
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/onemindlogo.png` },
    },
    ...(article.createdAt ? { datePublished: article.createdAt } : {}),
    ...(article.updatedAt ? { dateModified: article.updatedAt } : {}),
    ...(article.tags?.length ? { keywords: article.tags.join(", ") } : {}),
    ...(article.tags?.[0] ? { articleSection: article.tags[0] } : {}),
  };

  const pageJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      buildWebPageJsonLd({
        url: canonicalUrl,
        name: article.title,
        description,
        type: "WebPage",
        image: imageUrl,
        breadcrumbs,
        mainEntity: { "@id": `${canonicalUrl}#article` },
        datePublished: article.createdAt,
        dateModified: article.updatedAt || article.createdAt,
      }),
      articleJsonLd,
      breadcrumbs
        ? { ...breadcrumbs, "@id": `${canonicalUrl}#breadcrumb` }
        : null,
    ].filter(Boolean),
  };

  return (
    <div className="articles-page">
      <SeoJsonLd data={pageJsonLd} />

      <div className="article-detail-container">
        <BackButton fallback="/articles" />

        {imageUrl && (
          <Image
            src={imageUrl}
            alt={`${article.title} - featured image`}
            className="article-detail-image"
            width={800}
            height={450}
            priority
            sizes="(max-width: 768px) 100vw, 800px"
          />
        )}

        <h1 className="article-detail-title">{article.title}</h1>

        <div className="article-detail-meta">
          <span>{article.author || "Admin"}</span>
          <span>&middot;</span>
          <span>
            {new Date(article.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>

        {article.tags && article.tags.length > 0 && (
          <div className="article-detail-tags">
            {article.tags.map((tag, i) => (
              <span key={i} className="article-tag-chip">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div
          className="article-detail-content"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </div>
      <BackToTop />
    </div>
  );
}
