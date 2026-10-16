import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";
import "./ZoomImg.css";

const Lightbox = ({ src, alt, onClose }) => {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    const previousOverflow = document.body.style.overflow;
    window.addEventListener("keydown", onKey, true);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div
      className="zoom-overlay"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <button
        type="button"
        className="zoom-close"
        aria-label="Close"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <FiX size={22} />
      </button>
      <img
        className="zoom-full"
        src={src}
        alt={alt || ""}
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body,
  );
};

const ZoomImg = ({ src, alt, className = "", onClick, ...rest }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <img
        {...rest}
        src={src}
        alt={alt}
        className={`zoomable-img ${className}`.trim()}
        onClick={(e) => {
          e.stopPropagation();
          if (onClick) onClick(e);
          setOpen(true);
        }}
      />
      {open && <Lightbox src={src} alt={alt} onClose={() => setOpen(false)} />}
    </>
  );
};

export default ZoomImg;
