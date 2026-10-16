import Link from "next/link";
import "@/styles/NotFound.css";

export const metadata = {
  title: "Page Not Found",
  description:
    "The page you are looking for could not be found on OneMind Market.",
  robots: {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  },
};

export default function NotFound() {
  return (
    <section className="nf-section fade-in-up">
      <div className="nf-content">
        <span className="eyebrow">Error 404</span>
        <h1 className="nf-title">
          This page <em>could not be found</em>
        </h1>
        <p className="nf-desc">
          The page may have been moved, renamed, or removed. Head back home or
          explore local businesses on OneMind Market.
        </p>
        <div className="nf-buttons">
          <Link href="/" className="nf-btn-primary">
            Back to Home
          </Link>
          <Link href="/business-listing" className="nf-btn-secondary">
            Search Businesses
          </Link>
        </div>
      </div>
    </section>
  );
}
