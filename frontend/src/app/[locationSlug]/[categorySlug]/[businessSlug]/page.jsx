import { notFound, redirect } from "next/navigation";
import ShopDetailBody from "@/components/ShopDetailBody";
import SeoJsonLd from "@/components/SeoJsonLd";
import {
  fetchShopBySlug,
  fetchShopPhotos,
  canonicalShopPath,
  shopMetadata,
} from "@/lib/shop";
import {
  absoluteAssetUrl,
  buildBreadcrumbList,
  buildLocalBusinessJsonLd,
  buildWebPageJsonLd,
} from "@/lib/seo";
import { SITE_URL } from "@/lib/api";

export async function generateMetadata({ params }) {
  const shop = await fetchShopBySlug(params.businessSlug);
  if (!shop) {
    return {
      title: "Business not found",
      robots: { index: false, follow: false },
    };
  }
  return shopMetadata(shop);
}

export default async function ShopPage({ params }) {
  const shop = await fetchShopBySlug(params.businessSlug);
  if (!shop) notFound();

  const canonicalPath = canonicalShopPath(shop);
  if (canonicalPath !== `/${params.locationSlug}/${params.categorySlug}/${shop.slug}`) {
    redirect(canonicalPath);
  }

  const { photos1, photos2, photos3 } = await fetchShopPhotos(shop._id);
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;
  const imageUrls = [
    absoluteAssetUrl(shop.shopPhoto),
    ...photos1.slice(0, 5).map((photo) => absoluteAssetUrl(photo)),
    ...photos2.slice(0, 5).map((photo) => absoluteAssetUrl(photo)),
    ...photos3.slice(0, 5).map((photo) => absoluteAssetUrl(photo)),
  ].filter(Boolean);
  const breadcrumbs = buildBreadcrumbList([
    { name: "Home", url: SITE_URL },
    ...(shop.location?.name
      ? [{ name: shop.location.name, url: `${SITE_URL}/${shop.location.slug}` }]
      : []),
    ...(shop.category?.name && shop.location?.slug
      ? [
          {
            name: shop.category.name,
            url: `${SITE_URL}/${shop.location.slug}/${shop.category.slug}`,
          },
        ]
      : []),
    { name: shop.shopName, url: canonicalUrl },
  ]);
  const localBusinessJsonLd = buildLocalBusinessJsonLd({
    shop,
    url: canonicalUrl,
    imageUrls,
  });
  const pageJsonLd = buildWebPageJsonLd({
    url: canonicalUrl,
    name: shop.shopName,
    description:
      shop.shopDescription || `${shop.shopName} on OneMind Market.`,
    type: "WebPage",
    image: imageUrls[0],
    breadcrumbs,
    mainEntity: localBusinessJsonLd ? { "@id": `${canonicalUrl}#business` } : undefined,
  });
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      pageJsonLd,
      localBusinessJsonLd,
      breadcrumbs ? { ...breadcrumbs, "@id": `${canonicalUrl}#breadcrumb` } : null,
    ].filter(Boolean),
  };

  return (
    <>
      <SeoJsonLd data={jsonLd} />
      <ShopDetailBody
        shop={shop}
        photos1={photos1}
        photos2={photos2}
        photos3={photos3}
      />
    </>
  );
}
