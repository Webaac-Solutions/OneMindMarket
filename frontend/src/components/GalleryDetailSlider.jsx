"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { UPLOADS_URL } from "@/lib/api";
import GalleryLightbox from "@/components/GalleryLightbox";

function extractYoutubeId(url) {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  );
  return match ? match[1] : null;
}

const GalleryDetailSlider = ({ media, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const videoRef = useRef(null);
  const iframeRef = useRef(null);
  const timerRef = useRef(null);
  const touchStart = useRef(null);

  const currentItem = media[currentIndex];

  const stopCurrentMedia = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    if (iframeRef.current) {
      try {
        iframeRef.current.contentWindow.postMessage(
          '{"event":"command","func":"pauseVideo","args":""}',
          "*",
        );
      } catch (e) {}
    }
  }, []);

  const goToSlide = useCallback(
    (idx) => {
      stopCurrentMedia();
      setCurrentIndex(idx);
    },
    [stopCurrentMedia],
  );

  const goPrev = useCallback(() => {
    goToSlide(currentIndex === 0 ? media.length - 1 : currentIndex - 1);
  }, [currentIndex, media.length, goToSlide]);

  const goNext = useCallback(() => {
    goToSlide(currentIndex === media.length - 1 ? 0 : currentIndex + 1);
  }, [currentIndex, media.length, goToSlide]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (media.length <= 1) return;
    if (currentItem && currentItem.type !== "image") return;
    if (lightboxIndex !== null) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((i) => (i === media.length - 1 ? 0 : i + 1));
    }, 4000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [media, currentItem, lightboxIndex]);

  if (!media || media.length === 0) return null;

  const onTouchStart = (e) => {
    if (e.touches.length !== 1 || e.target.closest("video, iframe")) {
      touchStart.current = null;
      return;
    }
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const onTouchEnd = (e) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goNext();
      else goPrev();
    }
  };

  const images = media.filter((m) => m.type === "image");

  const lightbox =
    lightboxIndex !== null ? (
      <GalleryLightbox
        images={images}
        startIndex={lightboxIndex}
        title={title}
        onClose={() => setLightboxIndex(null)}
      />
    ) : null;

  const renderSlide = (item, idx) => {
    if (item.type === "video") {
      return (
        <video
          ref={idx === currentIndex ? videoRef : null}
          key={`video-${idx}`}
          src={`${UPLOADS_URL}/${item.url}`}
          controls
          className="gallery-detail-slider-media"
          preload="metadata"
          title={`${title || "Gallery"} - video ${idx + 1}`}
        />
      );
    }
    if (item.type === "youtube") {
      const ytId = extractYoutubeId(item.url);
      return (
        <iframe
          ref={idx === currentIndex ? iframeRef : null}
          key={`yt-${idx}-${currentIndex}`}
          src={`https://www.youtube.com/embed/${ytId}?enablejsapi=1`}
          title={`${title || "Video"} - video ${idx + 1}`}
          className="gallery-detail-slider-iframe"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }
    return (
      <Image
        key={`img-${idx}`}
        src={`${UPLOADS_URL}/${item.url}`}
        alt={`${title || "Gallery"} - gallery image ${idx + 1}`}
        className="gallery-detail-slider-img"
        width={800}
        height={500}
        priority={idx === 0}
        sizes="(max-width: 768px) 100vw, 800px"
        onClick={() => setLightboxIndex(images.indexOf(item))}
      />
    );
  };

  if (media.length === 1) {
    return (
      <div className="gallery-detail-slider">
        {renderSlide(media[0], 0)}
        {lightbox}
      </div>
    );
  }

  return (
    <div
      className="gallery-detail-slider"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button
        className="gallery-slider-btn gallery-slider-prev"
        onClick={goPrev}
      >
        &#8249;
      </button>
      {renderSlide(currentItem, currentIndex)}
      <button
        className="gallery-slider-btn gallery-slider-next"
        onClick={goNext}
      >
        &#8250;
      </button>
      <div className="gallery-slider-dots">
        {media.map((item, idx) => (
          <span
            key={idx}
            className={`gallery-slider-dot ${idx === currentIndex ? "active" : ""} ${item.type !== "image" ? "gallery-slider-dot-video" : ""}`}
            onClick={() => goToSlide(idx)}
          />
        ))}
      </div>
      {lightbox}
    </div>
  );
};

export default GalleryDetailSlider;
