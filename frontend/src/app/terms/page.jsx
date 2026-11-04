import Breadcrumbs from "@/components/Breadcrumbs";
import SeoJsonLd from "@/components/SeoJsonLd";
import { SITE_URL } from "@/lib/api";
import { buildBreadcrumbList, buildWebPageJsonLd } from "@/lib/seo";
import "@/styles/SeoExtras.css";

export const metadata = {
  title: "Terms of Service",
  description:
    "The terms for using the OneMind Market website, business directory, and member network.",
  alternates: { canonical: `${SITE_URL}/terms` },
};

export default function TermsPage() {
  const url = `${SITE_URL}/terms`;
  const breadcrumbs = buildBreadcrumbList([
    { name: "Home", url: SITE_URL },
    { name: "Terms of Service", url },
  ]);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      buildWebPageJsonLd({
        url,
        name: "Terms of Service",
        description: metadata.description,
        breadcrumbs,
      }),
      breadcrumbs ? { ...breadcrumbs, "@id": `${url}#breadcrumb` } : null,
    ].filter(Boolean),
  };

  return (
    <div className="legal-page">
      <SeoJsonLd data={jsonLd} />
      <Breadcrumbs
        items={[{ name: "Home", href: "/" }, { name: "Terms of Service" }]}
      />
      <h1>Terms of Service</h1>
      <p className="legal-updated">Last updated: November 2026</p>

      <p>
        By using the OneMind Market website you agree to these terms. If you do
        not agree, please do not use the site.
      </p>

      <h2>Using the directory</h2>
      <p>
        The directory helps you discover local businesses. Listings are provided
        by members, and we try to keep them accurate, but we cannot guarantee
        that every detail is complete or current. Please confirm important
        details directly with the business.
      </p>

      <h2>Membership</h2>
      <p>
        OneMind Market is intended for native, independent entrepreneurs. We
        review every join request and may accept, decline, or remove a listing
        at our discretion.
      </p>

      <h2>Your responsibilities</h2>
      <ul>
        <li>Provide accurate information when you submit forms.</li>
        <li>Do not misuse the site, send spam, or attempt to disrupt it.</li>
        <li>
          Do not copy or republish directory content in bulk without permission.
        </li>
      </ul>

      <h2>Third parties</h2>
      <p>
        Transactions and agreements between you and a listed business are
        between you and that business. OneMind Market is not a party to them.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms from time to time. Continued use of the site
        means you accept the updated terms.
      </p>

      <h2>Contact</h2>
      <p>
        Questions can be sent through the{" "}
        <a href="/about#contact-us">contact form</a>.
      </p>
    </div>
  );
}
