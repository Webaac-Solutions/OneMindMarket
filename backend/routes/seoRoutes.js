const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");
const Category = require("../models/Category");
const Location = require("../models/Location");
const Article = require("../models/Article");
const Gallery = require("../models/Gallery");

const SITE_URL = "https://onemindmarket.in";

function xmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function absoluteUrl(pathname) {
  if (!pathname) return SITE_URL;
  if (/^https?:\/\//i.test(pathname)) return pathname;
  return `${SITE_URL}/${String(pathname).replace(/^\/+/, "")}`;
}

function dateOnly(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().split("T")[0];
}

function appendUrl(xml, { loc, lastmod, images = [] }) {
  xml.push("  <url>");
  xml.push(`    <loc>${xmlEscape(absoluteUrl(loc))}</loc>`);
  if (lastmod) xml.push(`    <lastmod>${xmlEscape(lastmod)}</lastmod>`);

  for (const image of [...new Set(images.filter(Boolean))].slice(0, 50)) {
    xml.push("    <image:image>");
    xml.push(`      <image:loc>${xmlEscape(absoluteUrl(image))}</image:loc>`);
    xml.push("    </image:image>");
  }

  xml.push("  </url>");
}

// GET /sitemap.xml
router.get("/sitemap.xml", async (req, res) => {
  try {
    const [customers, locations, categories, articles, galleries] =
      await Promise.all([
        Customer.find({ isActive: { $ne: false } })
          .select("slug category location shopPhoto shopPhotos updatedAt")
          .populate("category", "slug name updatedAt")
          .populate("location", "slug name updatedAt")
          .lean(),
        Location.find({}).select("slug name updatedAt").lean(),
        Category.find({}).select("slug name updatedAt").lean(),
        Article.find({ status: "published" })
          .select("slug updatedAt featuredImage")
          .lean(),
        Gallery.find({ visible: true })
          .select("slug updatedAt media images")
          .lean(),
      ]);

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ];

    const locationMap = new Map(
      locations.filter((l) => l.slug).map((l) => [String(l._id), l]),
    );
    const categoryMap = new Map(
      categories.filter((c) => c.slug).map((c) => [String(c._id), c]),
    );

    appendUrl(xml, { loc: "/" });
    appendUrl(xml, { loc: "/about" });
    appendUrl(xml, { loc: "/join" });
    appendUrl(xml, { loc: "/gallery" });
    appendUrl(xml, { loc: "/articles" });

    for (const location of locations) {
      if (!location.slug) continue;
      appendUrl(xml, {
        loc: `/${location.slug}`,
        lastmod: dateOnly(location.updatedAt),
      });
    }

    // Only include location/category combinations that actually contain businesses.
    const locationCategoryPairs = new Map();
    for (const customer of customers) {
      const locSlug = customer.location?.slug;
      const catSlug = customer.category?.slug;
      if (!locSlug || !catSlug) continue;

      const key = `${locSlug}/${catSlug}`;
      const previous = locationCategoryPairs.get(key);
      const candidateDates = [
        customer.updatedAt,
        customer.location?.updatedAt,
        customer.category?.updatedAt,
      ].filter(Boolean);
      const latest = candidateDates
        .map((value) => new Date(value))
        .filter((date) => !Number.isNaN(date.getTime()))
        .sort((a, b) => b - a)[0];

      if (
        !previous ||
        (latest && (!previous.latest || latest > previous.latest))
      ) {
        locationCategoryPairs.set(key, { latest });
      }
    }

    for (const [pair, data] of locationCategoryPairs) {
      appendUrl(xml, {
        loc: `/${pair}`,
        lastmod: dateOnly(data.latest),
      });
    }

    // Business profile URLs are the primary SEO landing pages.
    for (const customer of customers) {
      const locSlug =
        customer.location?.slug ||
        locationMap.get(String(customer.location))?.slug;
      const catSlug =
        customer.category?.slug ||
        categoryMap.get(String(customer.category))?.slug;
      if (!customer.slug || !locSlug || !catSlug) continue;

      const images = [
        ...(customer.shopPhoto ? [`/uploads/${customer.shopPhoto}`] : []),
        ...(Array.isArray(customer.shopPhotos)
          ? customer.shopPhotos.slice(0, 20).map((photo) => `/uploads/${photo}`)
          : []),
      ];

      appendUrl(xml, {
        loc: `/${locSlug}/${catSlug}/${customer.slug}`,
        lastmod: dateOnly(customer.updatedAt),
        images,
      });
    }

    for (const article of articles) {
      if (!article.slug) continue;
      appendUrl(xml, {
        loc: `/articles/${article.slug}`,
        lastmod: dateOnly(article.updatedAt),
        images: article.featuredImage
          ? [`/uploads/${article.featuredImage}`]
          : [],
      });
    }

    for (const gallery of galleries) {
      if (!gallery.slug) continue;
      const media =
        Array.isArray(gallery.media) && gallery.media.length > 0
          ? gallery.media
          : (gallery.images || []).map((url) => ({ type: "image", url }));
      const images = media
        .filter((entry) => entry?.type === "image" && entry.url)
        .slice(0, 50)
        .map((entry) => `/uploads/${entry.url}`);

      appendUrl(xml, {
        loc: `/gallery/${gallery.slug}`,
        lastmod: dateOnly(gallery.updatedAt),
        images,
      });
    }

    // Google ignores priority/changefreq; accurate canonical URLs and lastmod are the important parts.
    xml.push("</urlset>");

    res
      .status(200)
      .set("Content-Type", "application/xml; charset=utf-8")
      .set(
        "Cache-Control",
        "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
      )
      .send(xml.join("\n"));
  } catch (err) {
    console.error("Sitemap generation error:", err);
    res.status(500).send("Error generating sitemap");
  }
});

// GET /robots.txt
router.get("/robots.txt", (req, res) => {
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /enquiry/

Sitemap: ${SITE_URL}/sitemap.xml
`;

  res
    .status(200)
    .set("Content-Type", "text/plain; charset=utf-8")
    .set(
      "Cache-Control",
      "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    )
    .send(robotsTxt);
});

module.exports = router;
