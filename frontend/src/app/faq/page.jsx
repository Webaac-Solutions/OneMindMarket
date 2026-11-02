import PageHeading from "@/components/PageHeading";
import FaqClient from "@/components/FaqClient";
import SeoJsonLd from "@/components/SeoJsonLd";
import { FAQS } from "@/lib/faqs";
import { SITE_URL } from "@/lib/api";
import { buildBreadcrumbList, buildWebPageJsonLd } from "@/lib/seo";
import "@/styles/Faq.css";

export const metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers to common questions about OneMind Market, the native entrepreneur network and local business directory.",
  alternates: { canonical: `${SITE_URL}/faq` },
  openGraph: {
    title: "Frequently Asked Questions | OneMind Market",
    description:
      "Answers to common questions about OneMind Market, the native entrepreneur network and local business directory.",
    url: `${SITE_URL}/faq`,
    type: "website",
    siteName: "OneMind Market",
    locale: "en_IN",
    images: [
      { url: `${SITE_URL}/onemindlogo.png`, alt: "OneMind Market logo" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Frequently Asked Questions | OneMind Market",
    description:
      "Answers to common questions about OneMind Market, the native entrepreneur network and local business directory.",
    images: [`${SITE_URL}/onemindlogo.png`],
  },
};

export default function FaqPage({ searchParams }) {
  const q = typeof searchParams?.q === "string" ? searchParams.q : "";
  const url = `${SITE_URL}/faq`;
  const breadcrumbs = buildBreadcrumbList([
    { name: "Home", url: SITE_URL },
    { name: "FAQ", url },
  ]);
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      buildWebPageJsonLd({
        url,
        name: "Frequently Asked Questions",
        description: metadata.description,
        type: "FAQPage",
        breadcrumbs,
        mainEntity: { "@id": `${url}#faq` },
      }),
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: FAQS.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      },
      breadcrumbs ? { ...breadcrumbs, "@id": `${url}#breadcrumb` } : null,
    ].filter(Boolean),
  };

  return (
    <div className="faq-page">
      <SeoJsonLd data={faqJsonLd} />
      <PageHeading
        eyebrow="Help"
        title="Frequently Asked Questions"
        subtitle="Everything you need to know about OneMind Market"
      />
      <FaqClient key={q} initialQuery={q} />
    </div>
  );
}
