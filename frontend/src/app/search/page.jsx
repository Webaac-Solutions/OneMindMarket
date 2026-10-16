import { redirect } from "next/navigation";

export default function SearchPage({ searchParams }) {
  const params = new URLSearchParams();
  if (searchParams?.q) params.set("q", searchParams.q);
  if (searchParams?.category) params.set("category", searchParams.category);
  if (searchParams?.location) params.set("location", searchParams.location);

  const query = params.toString();
  redirect(`/business-listing${query ? `?${query}` : ""}`);
}
