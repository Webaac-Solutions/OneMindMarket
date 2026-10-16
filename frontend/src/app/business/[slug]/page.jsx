import { notFound, permanentRedirect } from "next/navigation";
import { fetchShopBySlug, canonicalShopPath } from "@/lib/shop";

export default async function LegacyBusinessRoute({ params }) {
  const shop = await fetchShopBySlug(params.slug);
  if (!shop) notFound();
  permanentRedirect(canonicalShopPath(shop));
}
