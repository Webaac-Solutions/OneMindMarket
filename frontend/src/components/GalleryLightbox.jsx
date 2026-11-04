"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { UPLOADS_URL } from "@/lib/api";

const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const SWIPE_DISTANCE = 50;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const GalleryLightbox = ({ images, startIndex = 0, title, onClose }) => {
  const [index, setIndex] = useState(startIndex);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const stageRef = useRef(null);
  const gesture = useRef(null);
  const lastTap = useRef(0);
  const moved = useRef(false);
  const count = images.length;

  const clampOffset = useCallback((x, y, s) => {
    const stage = stageRef.current;
    if (!stage) return { x, y };
    const maxX = ((s - 1) * stage.clientWidth) / 2;
    const maxY = ((s - 1) * stage.clientHeight) / 2;
    return { x: clamp(x, -maxX, maxX), y: clamp(y, -maxY, maxY) };
  }, []);

  const changeScale = useCallback((next) => {
    const s = clamp(next, 1, MAX_SCALE);
    setScale(s);
    if (s === 1) setOffset({ x: 0, y: 0 });
  }, []);

  const go = useCallback(
    (dir) => {
      setScale(1);
      setOffset({ x: 0, y: 0 });
      setIndex((i) => (i + dir + count) % count);
    },
    [count],
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && count > 1) go(-1);
      else if (e.key === "ArrowRight" && count > 1) go(1);
      else if (e.key === "+" || e.key === "=") changeScale(scale + 0.5);
      else if (e.key === "-") changeScale(scale - 0.5);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, go, changeScale, scale, count]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const toggleZoom = () => changeScale(scale > 1 ? 1 : DOUBLE_TAP_SCALE);

  const onWheel = (e) => changeScale(scale * (e.deltaY < 0 ? 1.15 : 0.87));

  const onMouseDown = (e) => {
    moved.current = false;
    if (scale <= 1) return;
    gesture.current = {
      mode: "pan",
      x: e.clientX,
      y: e.clientY,
      ox: offset.x,
      oy: offset.y,
    };
    setDragging(true);
  };

  const onMouseMove = (e) => {
    const g = gesture.current;
    if (!g || g.mode !== "pan") return;
    moved.current = true;
    setOffset(
      clampOffset(g.ox + e.clientX - g.x, g.oy + e.clientY - g.y, scale),
    );
  };

  const endMouse = () => {
    gesture.current = null;
    setDragging(false);
  };

  const onStageClick = (e) => {
    if (moved.current) return;
    if (e.target.closest("button")) return;
    if (e.target.tagName !== "IMG") onClose();
  };

  const stopBubble = (e) => e.stopPropagation();

  const touchDistance = (t) =>
    Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

  const onTouchStart = (e) => {
    const t = e.touches;
    moved.current = false;
    if (t.length === 2) {
      gesture.current = {
        mode: "pinch",
        dist: touchDistance(t),
        startScale: scale,
      };
    } else if (t.length === 1) {
      gesture.current = {
        mode: "drag",
        x: t[0].clientX,
        y: t[0].clientY,
        ox: offset.x,
        oy: offset.y,
        dx: 0,
        dy: 0,
      };
      setDragging(true);
    }
  };

  const onTouchMove = (e) => {
    const g = gesture.current;
    const t = e.touches;
    if (!g) return;
    if (g.mode === "pinch" && t.length === 2) {
      moved.current = true;
      changeScale((g.startScale * touchDistance(t)) / g.dist);
    } else if (g.mode === "drag" && t.length === 1) {
      g.dx = t[0].clientX - g.x;
      g.dy = t[0].clientY - g.y;
      if (Math.abs(g.dx) > 8 || Math.abs(g.dy) > 8) moved.current = true;
      if (scale > 1) setOffset(clampOffset(g.ox + g.dx, g.oy + g.dy, scale));
    }
  };

  const onTouchEnd = (e) => {
    const g = gesture.current;
    if (e.touches.length > 0) {
      gesture.current = null;
      return;
    }
    gesture.current = null;
    setDragging(false);
    if (!g || g.mode !== "drag") return;

    if (!moved.current) {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        toggleZoom();
        lastTap.current = 0;
      } else {
        lastTap.current = now;
      }
      return;
    }

    if (
      scale === 1 &&
      count > 1 &&
      Math.abs(g.dx) > SWIPE_DISTANCE &&
      Math.abs(g.dx) > Math.abs(g.dy)
    ) {
      go(g.dx < 0 ? 1 : -1);
    }
  };

  const current = images[index];

  return createPortal(
    <div
      className="gallery-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${title || "Gallery"} image viewer`}
    >
      <div className="gallery-lightbox-bar">
        <span className="gallery-lightbox-count">
          {index + 1} / {count}
        </span>
        <div className="gallery-lightbox-actions">
          <button
            type="button"
            className="gallery-lightbox-btn gallery-lightbox-zoom"
            onClick={() => changeScale(scale - 0.5)}
            aria-label="Zoom out"
          >
            &minus;
          </button>
          <button
            type="button"
            className="gallery-lightbox-btn gallery-lightbox-zoom"
            onClick={() => changeScale(scale + 0.5)}
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            className="gallery-lightbox-btn"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
      </div>

      <div
        ref={stageRef}
        className="gallery-lightbox-stage"
        onClick={onStageClick}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endMouse}
        onMouseLeave={endMouse}
        onDoubleClick={toggleZoom}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {count > 1 && (
          <button
            type="button"
            className="gallery-lightbox-btn gallery-lightbox-nav gallery-lightbox-prev"
            onClick={() => go(-1)}
            onMouseDown={stopBubble}
            onDoubleClick={stopBubble}
            onTouchStart={stopBubble}
            onTouchEnd={stopBubble}
            aria-label="Previous image"
          >
            &#8249;
          </button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={current.url}
          src={`${UPLOADS_URL}/${current.url}`}
          alt={`${title || "Gallery"} - image ${index + 1}`}
          draggable={false}
          className={`gallery-lightbox-img ${scale > 1 ? "zoomed" : ""}`}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transition: dragging ? "none" : "transform 0.15s ease-out",
          }}
        />
        {count > 1 && (
          <button
            type="button"
            className="gallery-lightbox-btn gallery-lightbox-nav gallery-lightbox-next"
            onClick={() => go(1)}
            onMouseDown={stopBubble}
            onDoubleClick={stopBubble}
            onTouchStart={stopBubble}
            onTouchEnd={stopBubble}
            aria-label="Next image"
          >
            &#8250;
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default GalleryLightbox;
