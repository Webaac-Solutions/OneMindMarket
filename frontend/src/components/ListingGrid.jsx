import Link from "next/link";
import Image from "next/image";
import { FaWhatsapp, FaPhoneAlt } from "react-icons/fa";
import { UPLOADS_URL } from "@/lib/api";
import CallLink from "@/components/CallLink";
import "@/styles/SearchResults.css";

const toWhatsAppNumber = (phone) => {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.length === 10 ? `91${digits}` : digits;
};

const ListingGrid = ({ results, emptyMessage }) => {
  if (!results || results.length === 0) {
    return (
      <div className="sr-empty">
        <h2>No businesses found yet</h2>
        <p>
          {emptyMessage ||
            "Check back soon as more businesses join OneMind Market."}
        </p>
        <Link href="/" className="sr-back-btn">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="sr-results">
      {results.map((r, index) => {
        const locSlug = r.location?.slug || "unknown";
        const catSlug = r.category?.slug || "uncategorized";
        const imageAlt = [
          r.shopName,
          r.category?.name,
          r.location?.name ? `in ${r.location.name}` : null,
        ]
          .filter(Boolean)
          .join(" - ");

        return (
          <Link
            key={r._id}
            href={`/${locSlug}/${catSlug}/${r.slug}`}
            className="sr-card"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div className="sr-card-image">
              {r.shopPhoto ? (
                <Image
                  src={`${UPLOADS_URL}/${r.shopPhoto}`}
                  alt={`${imageAlt} business photo`}
                  width={160}
                  height={120}
                  priority={index < 2}
                  sizes="(max-width: 768px) 100vw, 160px"
                />
              ) : (
                <div className="sr-card-no-image">No Image</div>
              )}
            </div>
            <div className="sr-card-info">
              {r.category?.name && (
                <span className="sr-badge">{r.category.name}</span>
              )}
              <h3 className="sr-card-name">{r.shopName}</h3>
              {r.shopDescription && (
                <p className="sr-card-desc">
                  {r.shopDescription.length > 120
                    ? r.shopDescription.slice(0, 120) + "..."
                    : r.shopDescription}
                </p>
              )}
            </div>
            {r.shopPhone && (
              <div
                className="sr-card-contact"
                onClick={(e) => e.stopPropagation()}
              >
                <CallLink
                  shopId={r._id}
                  phone={r.shopPhone}
                  source="listing"
                  className="sr-call-btn"
                >
                  <FaPhoneAlt />
                </CallLink>
                {toWhatsAppNumber(r.shopPhone) && (
                  <a
                    href={`https://wa.me/${toWhatsAppNumber(r.shopPhone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sr-whatsapp-btn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FaWhatsapp />
                  </a>
                )}
              </div>
            )}

            <div className="sr-card-action">
              <span className="sr-view-btn">View Details</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default ListingGrid;
