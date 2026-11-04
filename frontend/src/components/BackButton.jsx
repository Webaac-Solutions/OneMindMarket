"use client";

import { useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";

const cameFromSite = () => {
  try {
    if (sessionStorage.getItem("omm-inapp-nav")) return true;
  } catch {}
  try {
    return (
      !!document.referrer &&
      new URL(document.referrer).origin === window.location.origin
    );
  } catch {
    return false;
  }
};

const BackButton = ({ fallback = "/", label = "Back" }) => {
  const router = useRouter();

  const handleClick = () => {
    if (window.history.length > 1 && cameFromSite()) router.back();
    else router.push(fallback);
  };

  return (
    <button
      type="button"
      className="back-btn"
      onClick={handleClick}
      aria-label="Go back"
    >
      <FiArrowLeft />
      <span>{label}</span>
    </button>
  );
};

export default BackButton;
