import { notFound } from "next/navigation";
import Link from "next/link";
import ListingGrid from "@/components/ListingGrid";
import SeoJsonLd from "@/components/SeoJsonLd";
import BackButton from "@/components/BackButton";
import Breadcrumbs from "@/components/Breadcrumbs";
import Pagination from "@/components/Pagination";
import { BASE_URL, SITE_URL } from "@/lib/api";
import {
  fetchLocationBySlug,
  fetchCategoryBySlug,
  fetchCustomers,
  categoryListingMetadata,
  parsePage,
} from "@/lib/listing";
import { buildBreadcrumbList, buildBusinessListJsonLd } from "@/lib/seo";

const PAGE_SIZE = 24;

async function fetchLocationCategories(locationId) {
  try {
    const res = await fetch(`${BASE_URL}/locations/${locationId}/categories`, {
      next: { revalidate: 60 },
    });
    return res.ok ? await res.json() : [];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params, searchParams }) {
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
  const page = parsePage(searchParams?.page);
  const { total } = await fetchCustomers({
    locationId: location._id,
    categoryId: category._id,
    page: 1,
    limit: 1,
  });
  return categoryListingMetadata(location, category, total === 0, page);
}

export default async function CategoryListingPage({ params, searchParams }) {
  const [location, category] = await Promise.all([
    fetchLocationBySlug(params.locationSlug),
    fetchCategoryBySlug(params.categorySlug),
  ]);
  if (!location || !category) notFound();

  const page = parsePage(searchParams?.page);

  const [{ results, total, totalPages }, siblingCategories] = await Promise.all(
    [
      fetchCustomers({
        locationId: location._id,
        categoryId: category._id,
        page,
        limit: PAGE_SIZE,
      }),
      fetchLocationCategories(location._id),
    ],
  );

  if (page > 1 && page > (totalPages || 1)) notFound();

  const basePath = `/${location.slug}/${category.slug}`;
  const url = `${SITE_URL}${basePath}`;
  const crumbs = [
    { name: "Home", href: "/" },
    { name: location.name, href: `/${location.slug}` },
    { name: category.name, href: basePath },
  ];
  const breadcrumbs = buildBreadcrumbList(
    crumbs.map((c) => ({
      name: c.name,
      url: c.href === "/" ? SITE_URL : `${SITE_URL}${c.href}`,
    })),
  );
  const jsonLd = buildBusinessListJsonLd({
    items: results,
    url: page > 1 ? `${url}?page=${page}` : url,
    name: `${category.name} in ${location.name}`,
    description: `Find trusted ${category.name} businesses in ${location.name} on OneMind Market.`,
    breadcrumbs,
  });
  const otherCategories = siblingCategories.filter(
    (c) => c.slug && c.slug !== category.slug,
  );

  return (
    <div className="sr-page">
      <SeoJsonLd data={jsonLd} />
      <Breadcrumbs items={crumbs} />
      <BackButton fallback={`/${location.slug}`} />

      <div className="sr-search-bar-wrap">
        <h1 style={{ margin: 0 }}>
          {category.name} in {location.name}
          {page > 1 ? ` - Page ${page}` : ""}
        </h1>
      </div>

      {total > 0 && (
        <p className="seo-intro">
          OneMind Market lists {total} {category.name}{" "}
          {total === 1 ? "business" : "businesses"} in {location.name}, with
          verified contact details, photos, and profiles for each entrepreneur
          and service provider.
        </p>
      )}

      <ListingGrid
        results={results}
        emptyMessage={`No ${category.name} businesses in ${location.name} yet.`}
      />

      <Pagination basePath={basePath} page={page} totalPages={totalPages} />

      <div className="seo-links">
        <h2>More in {location.name}</h2>
        <ul>
          <li>
            <Link href={`/${location.slug}`}>
              All businesses in {location.name}
            </Link>
          </li>
          {otherCategories.map((c) => (
            <li key={c._id}>
              <Link href={`/${location.slug}/${c.slug}`}>
                {c.name} in {location.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
