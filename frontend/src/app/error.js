"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "@/styles/NotFound.css";

export default function Error({ reset }) {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <section className="nf-section fade-in-up">
      <div className="nf-content">
        <span className="eyebrow">
          {offline ? "You're offline" : "Something went wrong"}
        </span>
        <h1 className="nf-title">
          {offline ? (
            <>
              No <em>internet connection</em>
            </>
          ) : (
            <>
              We couldn&apos;t <em>load this page</em>
            </>
          )}
        </h1>
        <p className="nf-desc">
          {offline
            ? "It looks like your device isn't connected to the internet. Check your connection, then try again."
            : "This is usually a temporary connection problem. Please try again, or head back home."}
        </p>
        <div className="nf-buttons">
          <button
            type="button"
            className="nf-btn-primary"
            onClick={() => reset()}
          >
            Try Again
          </button>
          <Link href="/" className="nf-btn-secondary">
            Back to Home
          </Link>
        </div>
      </div>
    </section>
  );
}
