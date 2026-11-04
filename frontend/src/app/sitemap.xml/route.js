import { BASE_URL, SITE_URL } from "@/lib/api";

export const revalidate = 3600;

const STATIC_PATHS = [
  "/",
  "/about",
  "/join",
  "/gallery",
  "/articles",
  "/business-listing",
  "/faq",
  "/announcements",
  "/privacy",
  "/terms",
];

const sitemapUrl = `${BASE_URL.replace(/\/api\/?$/, "")}/sitemap.xml`;

function fallbackSitemap() {
  const urls = STATIC_PATHS.map(
    (path) =>
      `  <url>\n    <loc>${SITE_URL}${path === "/" ? "" : path}</loc>\n  </url>`,
  ).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

function withExtraPages(xml) {
  const missing = ["/privacy", "/terms"].filter(
    (path) => !xml.includes(`<loc>${SITE_URL}${path}</loc>`),
  );
  if (missing.length === 0) return xml;
  const extra = missing
    .map((path) => `  <url>\n    <loc>${SITE_URL}${path}</loc>\n  </url>`)
    .join("\n");
  return xml.replace("</urlset>", `${extra}\n</urlset>`);
}

export async function GET() {
  let xml = null;
  try {
    const res = await fetch(sitemapUrl, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(25000),
    });
    if (res.ok) {
      const text = await res.text();
      if (text.includes("<urlset")) xml = withExtraPages(text);
    }
  } catch {}

  return new Response(xml || fallbackSitemap(), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control":
        "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
