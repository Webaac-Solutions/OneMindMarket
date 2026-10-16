"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { UPLOADS_URL } from "@/lib/api";
import PageHeading from "@/components/PageHeading";
import BackToTop from "@/components/BackToTop";
import "@/styles/Gallery.css";

function extractYoutubeId(url) {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  );
  return match ? match[1] : null;
}

const PREVIEW_WIDTH = 1280;

function safeWebsite(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function LivePreview({ url, title }) {
  const wrapRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [frame, setFrame] = useState({ scale: 0.3, height: 800 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const measure = () => {
      const scale = el.clientWidth / PREVIEW_WIDTH;
      setFrame({ scale, height: el.clientHeight / scale });
    };
    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(el);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          intersectionObserver.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    intersectionObserver.observe(el);

    return () => {
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, []);

  return (
    <div ref={wrapRef} className="gallery-live-preview">
      {inView && (
        <iframe
          src={url}
          title={`${title} - live website preview`}
          loading="lazy"
          sandbox="allow-scripts allow-same-origin"
          referrerPolicy="no-referrer"
          tabIndex={-1}
          aria-hidden="true"
          className="gallery-live-frame"
          style={{
            width: PREVIEW_WIDTH,
            height: frame.height,
            transform: `scale(${frame.scale})`,
          }}
        />
      )}
      <span className="gallery-live-badge">Live</span>
    </div>
  );
}

function getMediaArray(item) {
  if (item.media && item.media.length > 0) return item.media;
  const imgs = item.images || (item.image ? [item.image] : []);
  return imgs.map((img) => ({ type: "image", url: img }));
}

function hasVideoContent(media) {
  return media.some((m) => m.type === "video" || m.type === "youtube");
}

function CardThumbnail({ media, title }) {
  const firstImage = media.find((m) => m.type === "image");
  if (firstImage) {
    return (
      <div className="gallery-card-thumb-wrap">
        <Image
          src={`${UPLOADS_URL}/${firstImage.url}`}
          alt={`${title} - featured gallery image`}
          className="gallery-img-single"
          width={400}
          height={220}
          sizes="(max-width: 540px) 100vw, (max-width: 768px) 50vw, 350px"
        />
        {hasVideoContent(media) && (
          <span className="gallery-card-play-icon">&#9654;</span>
        )}
      </div>
    );
  }

  const firstYt = media.find((m) => m.type === "youtube");
  if (firstYt) {
    const ytId = extractYoutubeId(firstYt.url);
    if (ytId) {
      return (
        <div className="gallery-card-thumb-wrap">
          <Image
            src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
            alt={`${title} - YouTube video thumbnail`}
            className="gallery-img-single"
            width={320}
            height={180}
            sizes="(max-width: 540px) 100vw, (max-width: 768px) 50vw, 350px"
          />
          <span className="gallery-card-play-icon">&#9654;</span>
        </div>
      );
    }
  }

  const firstVideo = media.find((m) => m.type === "video");
  if (firstVideo) {
    return (
      <div className="gallery-card-thumb-wrap gallery-card-video-placeholder">
        <span
          className="gallery-card-play-icon"
          style={{ position: "static", transform: "none" }}
        >
          &#9654;
        </span>
      </div>
    );
  }

  return null;
}

const GalleryClient = ({ items }) => {
  const [activeTag, setActiveTag] = useState("");

  const allTags = [...new Set(items.flatMap((item) => item.tags || []))];

  const filtered = activeTag
    ? items.filter((item) => (item.tags || []).includes(activeTag))
    : items;

  return (
    <div className="gallery-page">
      <PageHeading
        eyebrow="Explore"
        title="Gallery"
        subtitle="Browse our curated photo & video collection"
      />

      {allTags.length > 0 && (
        <div className="gallery-tags-bar">
          <button
            className={`gallery-tag-btn ${activeTag === "" ? "active" : ""}`}
            onClick={() => setActiveTag("")}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`gallery-tag-btn ${activeTag === tag ? "active" : ""}`}
              onClick={() => setActiveTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="gallery-empty">No photos or videos available yet.</p>
      ) : (
        <div className="gallery-grid">
          {filtered.map((item) => {
            const media = getMediaArray(item);
            const site = safeWebsite(item.website);
            return (
              <div key={item._id} className="gallery-card">
                <Link
                  href={`/gallery/${item.slug}`}
                  className="gallery-card-link"
                >
                  <div className="gallery-card-preview">
                    <CardThumbnail media={media} title={item.title} />
                    {site && item.embeddable && (
                      <LivePreview url={site.href} title={item.title} />
                    )}
                  </div>
                  <div className="gallery-card-info">
                    <h3>{item.title}</h3>
                    {site && (
                      <span className="gallery-card-host">
                        {site.hostname.replace(/^www\./, "")}
                      </span>
                    )}
                    {item.caption && (
                      <p className="gallery-caption">{item.caption}</p>
                    )}
                    {item.tags && item.tags.length > 0 && (
                      <div className="gallery-tags">
                        {item.tags.map((tag, i) => (
                          <span key={i} className="gallery-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
                {site && (
                  <a
                    href={site.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gallery-visit-btn"
                  >
                    Visit site &#8599;
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
      <BackToTop />
    </div>
  );
};

export default GalleryClient;
