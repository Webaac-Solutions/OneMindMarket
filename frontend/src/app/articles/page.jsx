import Link from "next/link";
import Image from "next/image";
import SeoJsonLd from "@/components/SeoJsonLd";
import PageHeading from "@/components/PageHeading";
import BackToTop from "@/components/BackToTop";
import { BASE_URL, UPLOADS_URL, SITE_URL } from "@/lib/api";
import {
  absoluteAssetUrl,
  buildWebPageJsonLd,
  buildBreadcrumbList,
  buildKeywords,
  topByFrequency,
  truncate,
} from "@/lib/seo";
import "@/styles/Articles.css";

const BASE_KEYWORDS = [
  "OneMind Market articles",
  "local business articles",
  "business insights",
  "entrepreneur stories",
  "small business tips",
  "business guides",
  "community stories",
  "Vellore business news",
];

const BASE_DESCRIPTION =
  "Read local business articles, entrepreneur insights, practical guides, and community stories from OneMind Market.";

function buildArticlesMeta(articles) {
  const topTags = topByFrequency(
    articles.flatMap((a) => a.tags || []),
    6,
  );
  const description = topTags.length
    ? truncate(
        `Read ${articles.length} local business articles on ${topTags.slice(0, 4).join(", ")} and more - entrepreneur insights, practical guides, and community stories from OneMind Market.`,
        160,
      )
    : BASE_DESCRIPTION;
  const keywords = buildKeywords([
    ...BASE_KEYWORDS,
    ...topByFrequency(
      articles.flatMap((a) => a.tags || []),
      12,
    ),
  ]);
  return { description, keywords };
}

export async function generateMetadata() {
  const articles = await getArticles();
  const { description, keywords } = buildArticlesMeta(articles);
  return {
    title: "Articles & Business Insights",
    description,
    keywords,
    alternates: { canonical: `${SITE_URL}/articles` },
    openGraph: {
      title: "Articles & Business Insights | OneMind Market",
      description,
      url: `${SITE_URL}/articles`,
      type: "website",
      siteName: "OneMind Market",
      locale: "en_IN",
      images: [
        { url: `${SITE_URL}/onemindlogo.png`, alt: "OneMind Market logo" },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Articles & Business Insights | OneMind Market",
      description,
      images: [`${SITE_URL}/onemindlogo.png`],
    },
  };
}

async function getArticles() {
  try {
    const res = await fetch(`${BASE_URL}/articles`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data.filter((article) => article?.slug) : [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

export default async function ArticlesPage() {
  const articles = await getArticles();
  const { description: pageDescription } = buildArticlesMeta(articles);
  const url = `${SITE_URL}/articles`;
  const breadcrumbs = buildBreadcrumbList([
    { name: "Home", url: SITE_URL },
    { name: "Articles", url },
  ]);

  const itemList = {
    "@type": "ItemList",
    "@id": `${url}#article-list`,
    name: "OneMind Market Articles",
    numberOfItems: articles.length,
    itemListElement: articles.map((article, index) => {
      const articleUrl = `${url}/${article.slug}`;
      const image = absoluteAssetUrl(article.featuredImage);
      return {
        "@type": "ListItem",
        position: index + 1,
        url: articleUrl,
        item: {
          "@type": "Article",
          headline: article.title,
          url: articleUrl,
          ...(article.excerpt ? { description: article.excerpt } : {}),
          ...(image ? { image: image } : {}),
        },
      };
    }),
  };

  const pageJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      buildWebPageJsonLd({
        url,
        name: "Articles & Business Insights",
        description: pageDescription,
        type: "CollectionPage",
        breadcrumbs,
        mainEntity: { "@id": `${url}#article-list` },
      }),
      itemList,
      breadcrumbs ? { ...breadcrumbs, "@id": `${url}#breadcrumb` } : null,
    ].filter(Boolean),
  };

  return (
    <div className="articles-page">
      <SeoJsonLd data={pageJsonLd} />

      <PageHeading
        eyebrow="Insights"
        title="Articles"
        subtitle="Stories and insights from our community"
      />

      {articles.length === 0 ? (
        <p className="articles-empty">No articles available yet.</p>
      ) : (
        <div className="articles-list">
          {articles.map((article) => (
            <div key={article._id} className="article-card">
              <Link
                href={`/articles/${article.slug}`}
                className="article-card-link"
              >
                {article.featuredImage && (
                  <Image
                    src={`${UPLOADS_URL}/${article.featuredImage}`}
                    alt={`${article.title} - featured image`}
                    className="article-thumbnail"
                    width={400}
                    height={250}
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                )}
                <div className="article-content">
                  <h2>{article.title}</h2>
                  <div className="article-date">
                    {new Date(article.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  {article.tags && article.tags.length > 0 && (
                    <div className="article-tags">
                      {article.tags.map((tag, i) => (
                        <span key={i} className="article-tag-chip">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="article-excerpt">
                    {article.excerpt
                      ? article.excerpt.length > 250
                        ? article.excerpt.substring(0, 250) + "..."
                        : article.excerpt
                      : ""}
                  </p>
                  <span className="article-read-more">Read More</span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
      <BackToTop />
    </div>
  );
}
