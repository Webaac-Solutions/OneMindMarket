import Image from "next/image";
import Link from "next/link";
import { FaWhatsapp, FaPhoneAlt } from "react-icons/fa";
import { FiChevronRight } from "react-icons/fi";
import { UPLOADS_URL } from "@/lib/api";
import CallLink from "@/components/CallLink";
import BackButton from "@/components/BackButton";
import SaveButton from "@/components/SaveButton";
import ShopDetailInteractive, {
  ViewCounter,
  EnquiryButton,
  ShareButton,
} from "@/components/ShopDetailInteractive";
import "@/styles/ShopDetails.css";

const toWhatsAppNumber = (phone) => {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.length === 10 ? `91${digits}` : digits;
};

const ShopDetailBody = ({ shop, photos1, photos2, photos3 }) => {
  const waNumber = toWhatsAppNumber(shop.shopPhone);
  const waMessage = encodeURIComponent(
    `Hi, I found ${shop.shopName} on OneMind Market and would like to know more.`,
  );
  const mainImageAlt = [
    shop.shopName,
    shop.category?.name,
    shop.location?.name ? `in ${shop.location.name}` : null,
  ]
    .filter(Boolean)
    .join(" - ");

  const backFallback =
    shop.location?.slug && shop.category?.slug
      ? `/${shop.location.slug}/${shop.category.slug}`
      : "/business-listing";

  return (
    <div className="shop-details-container">
      <div className="shop-topbar">
        <BackButton fallback={backFallback} />
        <div className="shop-header-actions">
          <ViewCounter shopSlug={shop.slug} />
          <SaveButton shopId={shop._id} />
          <ShareButton shop={shop} />
        </div>
      </div>

      <nav className="shop-breadcrumbs" aria-label="Breadcrumb">
        <ol>
          <li>
            <Link href="/">Home</Link>
          </li>
          {shop.location?.slug && (
            <li>
              <FiChevronRight
                className="breadcrumb-sep"
                size={14}
                aria-hidden="true"
              />
              <Link href={`/${shop.location.slug}`}>{shop.location.name}</Link>
            </li>
          )}
          {shop.location?.slug && shop.category?.slug && (
            <li>
              <FiChevronRight
                className="breadcrumb-sep"
                size={14}
                aria-hidden="true"
              />
              <Link href={`/${shop.location.slug}/${shop.category.slug}`}>
                {shop.category.name}
              </Link>
            </li>
          )}
          <li>
            <FiChevronRight
              className="breadcrumb-sep"
              size={14}
              aria-hidden="true"
            />
            <span aria-current="page">{shop.shopName}</span>
          </li>
        </ol>
      </nav>

      <div className="shop-header">
        <Image
          src={`${UPLOADS_URL}/${shop.shopPhoto}`}
          alt={`${mainImageAlt} business photo`}
          className="shop-main-image"
          width={250}
          height={280}
          priority
        />

        <div className="shop-info">
          <h1 className="shop_name">{shop.shopName}</h1>
          <div className="tags">
            <span>{shop.category?.name}</span>
            <span>{shop.location?.name}</span>
          </div>

          <div className="shop-short-details">
            <p>
              <strong>Phone:</strong>{" "}
              {shop.shopPhone ? (
                <CallLink shopId={shop._id} phone={shop.shopPhone}>
                  {shop.shopPhone}
                </CallLink>
              ) : (
                shop.shopPhone
              )}
            </p>
            <p>
              <strong>Email:</strong>{" "}
              {shop.email ? (
                <a href={`mailto:${shop.email}`}>{shop.email}</a>
              ) : (
                shop.email
              )}
            </p>
            <p>
              <strong>Address:</strong> {shop.address}
            </p>
            <p>
              <strong>Website:</strong>{" "}
              <a
                href={
                  shop.website?.startsWith("http")
                    ? shop.website
                    : `https://${shop.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                {shop.website}
              </a>
            </p>

            <div className="shop-contact-actions">
              {shop.shopPhone && (
                <CallLink
                  shopId={shop._id}
                  phone={shop.shopPhone}
                  className="call-btn"
                >
                  <FaPhoneAlt className="call-icon" />
                  Call Now
                </CallLink>
              )}
              {waNumber && (
                <a
                  href={`https://wa.me/${waNumber}?text=${waMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whatsapp-btn-detail"
                >
                  <FaWhatsapp className="whatsapp-icon" />
                  WhatsApp
                </a>
              )}
              <EnquiryButton shopId={shop._id} />
            </div>
          </div>
        </div>
      </div>

      {shop.shopDescription && (
        <div className="shop-description-section">
          <h3>Business Description</h3>
          <p className="business-description">{shop.shopDescription}</p>
        </div>
      )}

      {shop.shopArticle && (
        <div className="shop-article-section">
          <h3>Shop Article</h3>
          <p className="business-article">{shop.shopArticle}</p>
        </div>
      )}
      <ShopDetailInteractive
        shop={shop}
        photos1={photos1}
        photos2={photos2}
        photos3={photos3}
      />

      <div className="shop-sticky-bar">
        {shop.shopPhone && (
          <CallLink
            shopId={shop._id}
            phone={shop.shopPhone}
            className="shop-sticky-btn shop-sticky-btn--call"
          >
            <FaPhoneAlt />
            Call
          </CallLink>
        )}
        {waNumber && (
          <a
            href={`https://wa.me/${waNumber}?text=${waMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shop-sticky-btn shop-sticky-btn--wa"
          >
            <FaWhatsapp />
            WhatsApp
          </a>
        )}
        <Link
          href={`/enquiry/${shop._id}`}
          className="shop-sticky-btn shop-sticky-btn--enquiry"
        >
          Enquiry
        </Link>
      </div>
    </div>
  );
};

export default ShopDetailBody;
