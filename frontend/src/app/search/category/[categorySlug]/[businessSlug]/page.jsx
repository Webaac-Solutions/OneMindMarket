import { notFound, permanentRedirect } from "next/navigation";
import { fetchShopBySlug, canonicalShopPath } from "@/lib/shop";

export default async function LegacySearchCategoryRoute({ params }) {
  const shop = await fetchShopBySlug(params.businessSlug);
  if (!shop) notFound();
  permanentRedirect(canonicalShopPath(shop));
}
