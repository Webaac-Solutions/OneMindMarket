import PageHeading from "@/components/PageHeading";
import { FAQS } from "@/lib/faqs";
import { SITE_URL } from "@/lib/api";
import "@/styles/Faq.css";

export const metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers to common questions about OneMind Market, the native entrepreneur network and local business directory.",
  alternates: { canonical: `${SITE_URL}/faq` },
};

export default function FaqPage() {
  return (
    <div className="faq-page">
      <PageHeading
        eyebrow="Help"
        title="Frequently Asked Questions"
        subtitle="Everything you need to know about OneMind Market"
      />
      <div className="faq-list">
        {FAQS.map((f) => (
          <div key={f.id} className="faq-item">
            <p className="faq-q">
              <span className="faq-label">Q:</span> {f.question}
            </p>
            <p className="faq-a">
              <span className="faq-label">A:</span> {f.answer}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
