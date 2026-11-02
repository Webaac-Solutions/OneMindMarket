import Breadcrumbs from "@/components/Breadcrumbs";
import SeoJsonLd from "@/components/SeoJsonLd";
import { SITE_URL } from "@/lib/api";
import { buildBreadcrumbList, buildWebPageJsonLd } from "@/lib/seo";
import "@/styles/SeoExtras.css";

export const metadata = {
  title: "Privacy Policy",
  description:
    "How OneMind Market collects, uses, and protects the information you share when you browse the directory, send enquiries, or join the network.",
  alternates: { canonical: `${SITE_URL}/privacy` },
};

export default function PrivacyPage() {
  const url = `${SITE_URL}/privacy`;
  const breadcrumbs = buildBreadcrumbList([
    { name: "Home", url: SITE_URL },
    { name: "Privacy Policy", url },
  ]);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      buildWebPageJsonLd({
        url,
        name: "Privacy Policy",
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
        items={[{ name: "Home", href: "/" }, { name: "Privacy Policy" }]}
      />
      <h1>Privacy Policy</h1>
      <p className="legal-updated">Last updated: November 2026</p>

      <p>
        OneMind Market is a local business directory and entrepreneur network.
        This policy explains what information we collect and how we use it.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          Details you submit through the join form, enquiry forms, and contact
          form, such as your name, mobile number, email, and business details.
        </li>
        <li>
          Basic usage information, such as pages visited and calls or enquiries
          made to listed businesses, to help us improve the directory.
        </li>
        <li>
          If you enable notifications, a push subscription identifier from your
          browser so we can send announcements.
        </li>
      </ul>

      <h2>How we use your information</h2>
      <ul>
        <li>To review join requests and contact you about your listing.</li>
        <li>To pass your enquiry to the business you contacted.</li>
        <li>To send announcements if you have turned notifications on.</li>
        <li>To keep the website secure and understand how it is used.</li>
      </ul>

      <h2>Sharing</h2>
      <p>
        We do not sell your personal information. Business listing details that
        members choose to publish, such as shop name, address, and phone number,
        are shown publicly in the directory.
      </p>

      <h2>Notifications and your choices</h2>
      <p>
        You can turn off notifications at any time from your browser settings or
        the notification bell on the site. To ask us to correct or remove
        information you submitted, contact us through the{" "}
        <a href="/about#contact-us">contact form</a>.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy can be sent through the{" "}
        <a href="/about#contact-us">contact form</a> or by calling +91 96776
        90666.
      </p>
    </div>
  );
}
