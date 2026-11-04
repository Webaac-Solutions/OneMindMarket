const path = require("path");
const fs = require("fs");
const Customer = require("../models/Customer");
const Article = require("../models/Article");
const Gallery = require("../models/Gallery");

const SITE_URL = "https://onemindmarket.in";

const BOT_UA =
  /googlebot|bingbot|yandex|baiduspider|facebookexternalhit|twitterbot|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|slackbot|vkShare|W3C_Validator|whatsapp/i;

// Read index.html template once at startup (path configurable via env var)
const FRONTEND_BUILD =
  process.env.FRONTEND_BUILD_PATH || path.join(__dirname, "../frontend/build");
const INDEX_PATH = path.join(FRONTEND_BUILD, "index.html");
let htmlTemplate = null;
try {
  if (fs.existsSync(INDEX_PATH)) {
    htmlTemplate = fs.readFileSync(INDEX_PATH, "utf-8");
    console.log("botSeo: Loaded index.html template from", INDEX_PATH);
  } else {
    console.warn("botSeo: index.html not found at", INDEX_PATH);
  }
} catch (err) {
  console.warn("botSeo: Could not read index.html template:", err.message);
}

// URL patterns
const NEW_SEO_ROUTE = /^\/([^/]+)\/([^/]+)\/([^/]+)\/?$/;
const OLD_SEO_ROUTE = /^\/search\/category\/([^/]+)\/([^/]+)\/?$/;
const LEGACY_ROUTE = /^\/(business|shop)\/([^/]+)\/?$/;
const ARTICLE_ROUTE = /^\/articles\/([^/]+)\/?$/;
const GALLERY_ROUTE = /^\/gallery\/([^/]+)\/?$/;
// Paths that should NOT match the 3-segment business route
const RESERVED_PREFIXES = new Set([
  "admin",
  "api",
  "search",
  "about",
  "join",
  "enquiry",
  "gallery",
  "articles",
  "business",
  "shop",
]);

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function replaceMeta(
  html,
  { title, description, canonicalUrl, ogImage, ogType },
) {
  let result = html;

  result = result.replace(
    /<title>[^<]*<\/title>/,
    `<title>${escapeHtml(title)}</title>`,
  );

  result = result.replace(
    /<meta name="description" content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${escapeHtml(description)}" />`,
  );

  result = result.replace(
    /<link rel="canonical" href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
  );

  result = result.replace(
    /<meta property="og:title" content="[^"]*"\s*\/?>/,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
  );
  result = result.replace(
    /<meta property="og:description" content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
  );
  result = result.replace(
    /<meta property="og:url" content="[^"]*"\s*\/?>/,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
  );
  result = result.replace(
    /<meta property="og:image" content="[^"]*"\s*\/?>/,
    `<meta property="og:image" content="${escapeHtml(ogImage || `${SITE_URL}/onemindlogo.png`)}" />`,
  );
  if (ogType) {
    result = result.replace(
      /<meta property="og:type" content="[^"]*"\s*\/?>/,
      `<meta property="og:type" content="${escapeHtml(ogType)}" />`,
    );
  }

  return result;
}

async function handleBusinessPage(bizSlug) {
  const shop = await Customer.findOne({
    slug: bizSlug,
    isActive: { $ne: false },
  })
    .populate("category", "slug name")
    .populate("location", "slug name")
    .lean();
  if (!shop) return null;

  const locSlug = shop.location?.slug || "unknown";
  const catSlug = shop.category?.slug || "uncategorized";
  const canonicalUrl = `${SITE_URL}/${locSlug}/${catSlug}/${shop.slug}`;

  return replaceMeta(htmlTemplate, {
    title: `${shop.shopName} | OneMind Market`,
    description: shop.shopDescription
      ? shop.shopDescription.substring(0, 160)
      : `${shop.shopName} - Find details, photos, and contact info on OneMind Market.`,
    canonicalUrl,
    ogImage: shop.shopPhoto
      ? `${SITE_URL}/uploads/thumb/${shop.shopPhoto}`
      : null,
    ogType: "business.business",
  });
}

async function handleArticlePage(articleSlug) {
  const article = await Article.findOne({
    slug: articleSlug,
    status: "published",
  }).lean();
  if (!article) return null;

  const canonicalUrl = `${SITE_URL}/articles/${article.slug}`;

  return replaceMeta(htmlTemplate, {
    title: `${article.title} | OneMind Market`,
    description: article.excerpt
      ? article.excerpt.substring(0, 160)
      : article.content.replace(/<[^>]*>/g, "").substring(0, 160),
    canonicalUrl,
    ogImage: article.featuredImage
      ? `${SITE_URL}/uploads/thumb/${article.featuredImage}`
      : null,
    ogType: "article",
  });
}

async function handleGalleryPage(gallerySlug) {
  const gallery = await Gallery.findOne({
    slug: gallerySlug,
    visible: true,
  }).lean();
  if (!gallery) return null;

  const canonicalUrl = `${SITE_URL}/gallery/${gallery.slug}`;
  const firstImage = gallery.images && gallery.images[0];

  return replaceMeta(htmlTemplate, {
    title: `${gallery.title} | Gallery | OneMind Market`,
    description: gallery.caption
      ? gallery.caption.substring(0, 160)
      : `${gallery.title} - View photos on OneMind Market.`,
    canonicalUrl,
    ogImage: firstImage ? `${SITE_URL}/uploads/thumb/${firstImage}` : null,
    ogType: "article",
  });
}

module.exports = function botSeoMiddleware(req, res, next) {
  if (!htmlTemplate) return next();

  const ua = req.headers["user-agent"] || "";
  if (!BOT_UA.test(ua)) return next();

  // Homepage - serve template as-is (meta tags are already correct in index.html)
  if (req.path === "/" || req.path === "/index.html") {
    res.set("Content-Type", "text/html");
    return res.send(htmlTemplate);
  }

  // Business profile pages
  let bizSlug = null;
  const newMatch = req.path.match(NEW_SEO_ROUTE);
  if (newMatch && !RESERVED_PREFIXES.has(newMatch[1].toLowerCase())) {
    bizSlug = decodeURIComponent(newMatch[3]);
  }
  if (!bizSlug) {
    const oldMatch = req.path.match(OLD_SEO_ROUTE);
    if (oldMatch) {
      bizSlug = decodeURIComponent(oldMatch[2]);
    } else {
      const legacyMatch = req.path.match(LEGACY_ROUTE);
      if (legacyMatch) {
        bizSlug = decodeURIComponent(legacyMatch[2]);
      }
    }
  }

  if (bizSlug) {
    return handleBusinessPage(bizSlug)
      .then((html) => {
        if (!html) return next();
        res.set("Content-Type", "text/html");
        res.send(html);
      })
      .catch((err) => {
        console.error("botSeo business error:", err);
        next();
      });
  }

  // Article pages
  const articleMatch = req.path.match(ARTICLE_ROUTE);
  if (articleMatch) {
    const articleSlug = decodeURIComponent(articleMatch[1]);
    return handleArticlePage(articleSlug)
      .then((html) => {
        if (!html) return next();
        res.set("Content-Type", "text/html");
        res.send(html);
      })
      .catch((err) => {
        console.error("botSeo article error:", err);
        next();
      });
  }

  // Gallery pages
  const galleryMatch = req.path.match(GALLERY_ROUTE);
  if (galleryMatch) {
    const gallerySlug = decodeURIComponent(galleryMatch[1]);
    return handleGalleryPage(gallerySlug)
      .then((html) => {
        if (!html) return next();
        res.set("Content-Type", "text/html");
        res.send(html);
      })
      .catch((err) => {
        console.error("botSeo gallery error:", err);
        next();
      });
  }

  // All other pages - serve template as-is (static meta tags from index.html)
  res.set("Content-Type", "text/html");
  res.send(htmlTemplate);
};
