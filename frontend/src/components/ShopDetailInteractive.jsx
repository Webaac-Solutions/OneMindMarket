"use client";

import { useEffect, useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FaEye, FaCheck } from "react-icons/fa";
import { FiCornerUpRight } from "react-icons/fi";
import { BASE_URL, UPLOADS_URL } from "@/lib/api";
import { useToast } from "@/components/Toast";

function Slider({ photos, label, shopName }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!photos || photos.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((i) => (i === photos.length - 1 ? 0 : i + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [photos.length]);

  if (!photos || photos.length === 0) return null;

  return (
    <div className="slider-group">
      <div className="slider-single">
        <Image
          key={currentIndex}
          src={`${UPLOADS_URL}/${photos[currentIndex]}`}
          alt={`${shopName || "Business"} - ${label} photo ${currentIndex + 1}`}
          className="slider-image-cover"
          width={500}
          height={350}
          sizes="(max-width: 768px) 100vw, 500px"
        />
      </div>
    </div>
  );
}

function ThreeSliders({ photos1, photos2, photos3, shopName }) {
  const groups = [
    { photos: photos1, label: "Gallery A" },
    { photos: photos2, label: "Gallery B" },
    { photos: photos3, label: "Gallery C" },
  ].filter((g) => g.photos && g.photos.length > 0);

  if (groups.length === 0) return null;

  return (
    <div className="image-slider-section">
      <h3>Business Gallery</h3>
      <div
        className={`three-sliders${groups.length === 1 ? " three-sliders--single" : ""}`}
      >
        {groups.map((g) => (
          <Slider
            key={g.label}
            photos={g.photos}
            label={g.label}
            shopName={shopName}
          />
        ))}
      </div>
    </div>
  );
}

function OwnerDetailsToggle({ shop }) {
  const [visible, setVisible] = useState(false);
  const containerRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;
    if (visible) {
      container.style.maxHeight = content.scrollHeight + "px";
      requestAnimationFrame(() => content.classList.add("show"));
    } else {
      container.style.maxHeight = content.scrollHeight + "px";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          content.classList.remove("show");
          container.style.maxHeight = "0px";
        });
      });
    }
  }, [visible]);

  return (
    <div className="owner-details-section">
      <button
        className="view-owner-btn"
        onClick={() => setVisible((v) => !v)}
        aria-expanded={visible}
      >
        {visible ? "Hide Owner Details" : "View Owner Details"}
      </button>

      <div
        className="owner-container"
        ref={containerRef}
        style={{ maxHeight: 0 }}
      >
        <div className="owner-card" ref={contentRef}>
          {shop.ownerPhoto && (
            <Image
              src={`${UPLOADS_URL}/${shop.ownerPhoto}`}
              alt={`Photo of ${shop.ownerName || "the owner"} of ${shop.shopName}`}
              className="owner-image"
              width={150}
              height={150}
            />
          )}
          <div>
            <p>
              <strong>Owner Name:</strong> {shop.ownerName}
            </p>
            <p>
              <strong>Owner Phone:</strong> {shop.ownerPhone}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export const ViewCounter = ({ shopSlug }) => {
  const [viewCount, setViewCount] = useState(0);

  /* Record a view when shop data is loaded */
  useEffect(() => {
    if (!shopSlug) return;
    fetch(`${BASE_URL}/customers/slug/${shopSlug}/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referrer: document.referrer }),
    })
      .then((r) => r.json())
      .then((data) => setViewCount(data.viewCount || 0))
      .catch(() => {});
  }, [shopSlug]);

  return (
    <div className="view-counter">
      <FaEye className="view-icon" />
      <span>{viewCount}</span>
    </div>
  );
};

export const EnquiryButton = ({ shopId }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <button
      className="enquiry-btn"
      disabled={isPending}
      onClick={() =>
        startTransition(() => {
          router.push(`/enquiry/${shopId}`);
        })
      }
    >
      {isPending ? <span className="btn-spinner" /> : "Send Enquiry"}
    </button>
  );
};

export const ShareButton = ({ shop }) => {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareData = {
      title: shop.shopName,
      text: `Check out ${shop.shopName} on OneMind Market`,
      url,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error(
        "Couldn't copy the link. Please copy it from the address bar.",
      );
    }
  };

  return (
    <button
      className="share-btn"
      onClick={handleShare}
      type="button"
      aria-label="Share this business"
      title="Share"
    >
      {copied ? (
        <FaCheck className="share-icon" />
      ) : (
        <FiCornerUpRight className="share-icon" />
      )}
    </button>
  );
};

export const SimilarBusinesses = ({ shop }) => {
  const [similar, setSimilar] = useState([]);

  useEffect(() => {
    if (!shop?.category?._id) return;
    const url = new URL(`${BASE_URL}/customers`);
    url.searchParams.append("category", shop.category._id);
    if (shop.location?._id)
      url.searchParams.append("location", shop.location._id);
    url.searchParams.append("page", 1);
    url.searchParams.append("limit", 6);

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const results = (data.results || []).filter((r) => r._id !== shop._id);
        setSimilar(results.slice(0, 4));
      })
      .catch(() => setSimilar([]));
  }, [shop?.category?._id, shop?.location?._id, shop?._id]);

  if (similar.length === 0) return null;

  return (
    <div className="similar-businesses-section">
      <h2>
        Other {shop.category?.name || "similar"} businesses
        {shop.location?.name ? ` in ${shop.location.name}` : ""}
      </h2>
      <div className="similar-businesses-grid">
        {similar.map((r) => {
          const locSlug = r.location?.slug || "unknown";
          const catSlug = r.category?.slug || "uncategorized";
          return (
            <Link
              key={r._id}
              href={`/${locSlug}/${catSlug}/${r.slug}`}
              className="similar-business-card"
            >
              <div className="similar-business-image">
                {r.shopPhoto ? (
                  <Image
                    src={`${UPLOADS_URL}/${r.shopPhoto}`}
                    alt={`${r.shopName} business photo`}
                    width={200}
                    height={140}
                    sizes="(max-width: 768px) 50vw, 200px"
                  />
                ) : (
                  <div className="similar-business-no-image">No Image</div>
                )}
              </div>
              <div className="similar-business-info">
                <h3>{r.shopName}</h3>
                {r.category?.name && <span>{r.category.name}</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

const ShopDetailInteractive = ({ shop, photos1, photos2, photos3 }) => {
  return (
    <>
      <ThreeSliders
        photos1={photos1}
        photos2={photos2}
        photos3={photos3}
        shopName={shop.shopName}
      />

      <div className="details-section">
        <h2>Owner Details</h2>
        <OwnerDetailsToggle shop={shop} />
      </div>

      <SimilarBusinesses shop={shop} />
    </>
  );
};

export default ShopDetailInteractive;
