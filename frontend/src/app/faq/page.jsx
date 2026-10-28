import PageHeading from "@/components/PageHeading";
import FaqClient from "@/components/FaqClient";
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

  return (
    <div className="faq-page">
      <PageHeading
        eyebrow="Help"
        title="Frequently Asked Questions"
        subtitle="Everything you need to know about OneMind Market"
      />
      <FaqClient key={q} initialQuery={q} />
    </div>
  );
}
