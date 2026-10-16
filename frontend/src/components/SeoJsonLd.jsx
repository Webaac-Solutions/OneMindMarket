import { buildSafeJsonLd } from "@/lib/seo";

export default function SeoJsonLd({ data }) {
  if (!data) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: buildSafeJsonLd(data) }}
    />
  );
}
