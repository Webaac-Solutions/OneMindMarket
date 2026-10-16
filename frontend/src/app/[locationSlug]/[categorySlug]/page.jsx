import { notFound } from "next/navigation";
import Link from "next/link";
import ListingGrid from "@/components/ListingGrid";
import SeoJsonLd from "@/components/SeoJsonLd";
import BackButton from "@/components/BackButton";
import { SITE_URL } from "@/lib/api";
import {
  fetchLocationBySlug,
  fetchCategoryBySlug,
  fetchCustomers,
  categoryListingMetadata,
} from "@/lib/listing";
import { buildBreadcrumbList, buildBusinessListJsonLd } from "@/lib/seo";

export async function generateMetadata({ params }) {
  const [location, category] = await Promise.all([
    fetchLocationBySlug(params.locationSlug),
    fetchCategoryBySlug(params.categorySlug),
  ]);
  if (!location || !category) {
    return {
      title: "Page not found",
      robots: { index: false, follow: false },
    };
  }
  const { results } = await fetchCustomers({
    locationId: location._id,
    categoryId: category._id,
    page: 1,
    limit: 1,
  });
  return categoryListingMetadata(location, category, results.length === 0);
}

export default async function CategoryListingPage({ params }) {
  const [location, category] = await Promise.all([
    fetchLocationBySlug(params.locationSlug),
    fetchCategoryBySlug(params.categorySlug),
  ]);
  if (!location || !category) notFound();

  const { results } = await fetchCustomers({
    locationId: location._id,
    categoryId: category._id,
    page: 1,
    limit: 24,
  });

  const url = `${SITE_URL}/${location.slug}/${category.slug}`;
  const breadcrumbs = buildBreadcrumbList([
    { name: "Home", url: SITE_URL },
    { name: location.name, url: `${SITE_URL}/${location.slug}` },
    { name: category.name, url },
  ]);
  const jsonLd = buildBusinessListJsonLd({
    items: results,
    url,
    name: `${category.name} in ${location.name}`,
    description: `Find trusted ${category.name} businesses in ${location.name} on OneMind Market.`,
    breadcrumbs,
  });

  return (
    <div className="sr-page">
      <SeoJsonLd data={jsonLd} />
      <BackButton fallback={`/${location.slug}`} />

      <div className="sr-search-bar-wrap">
        <h1 style={{ margin: 0 }}>
          {category.name} in {location.name}
        </h1>
      </div>
      <p className="search-hint">
        <Link href={`/${location.slug}`}>
          All businesses in {location.name}
        </Link>
      </p>

      <ListingGrid
        results={results}
        emptyMessage={`No ${category.name} businesses in ${location.name} yet.`}
      />
    </div>
  );
}
