import PageHeading from "@/components/PageHeading";
import FaqClient from "@/components/FaqClient";
import SeoJsonLd from "@/components/SeoJsonLd";
import { FAQS } from "@/lib/faqs";
import { SITE_URL } from "@/lib/api";
import "@/styles/Faq.css";

export const metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers to common questions about OneMind Market, the native entrepreneur network and local business directory.",
  alternates: { canonical: `${SITE_URL}/faq` },
};

export default function FaqPage({ searchParams }) {
  const q = typeof searchParams?.q === "string" ? searchParams.q : "";
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
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
