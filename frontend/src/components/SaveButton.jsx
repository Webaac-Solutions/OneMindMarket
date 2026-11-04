"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { SAVED_EVENT, getSavedIds, toggleSavedId } from "@/lib/savedShops";

const SaveButton = ({ shopId, variant = "detail", approved = false }) => {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const sync = () => setSaved(getSavedIds().includes(shopId));
    sync();
    window.addEventListener(SAVED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SAVED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [shopId]);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSaved(toggleSavedId(shopId));
  };

  return (
    <>
      <button
        type="button"
        className={`save-btn save-btn--${variant} ${saved ? "save-btn--saved" : ""}`}
        onClick={handleClick}
        aria-pressed={saved}
        aria-label={saved ? "Remove from saved" : "Save this business"}
        title={saved ? "Saved" : "Save"}
      >
        {saved ? <FaHeart /> : <FaRegHeart />}
      </button>
      {/* only listing cards pass approved, sits right next to the heart */}
      {approved && (
        <span
          className={`approved-badge approved-badge--${variant}`}
          data-tooltip="One Mind Approved"
          role="img"
          aria-label="One Mind Approved"
        >
          <Image src="/onemind-icon.png" alt="" width={18} height={18} />
        </span>
      )}
    </>
  );
};

export default SaveButton;
