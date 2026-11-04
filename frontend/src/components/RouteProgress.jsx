"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// idle -> loading (click detected) -> done (route changed) -> idle
const RouteProgress = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState("idle");
  const resetTimer = useRef(null);
  const mounted = useRef(false);

  useEffect(() => {
    const handleClick = (e) => {
      const anchor = e.target.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      )
        return;
      if (anchor.target === "_blank" || e.metaKey || e.ctrlKey) return;
      let url;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (
        url.pathname + url.search ===
        window.location.pathname + window.location.search
      )
        return;
      setState("loading");
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // The pathname/search params only change once the destination route has
  // actually rendered, so that's the signal to finish the bar.
  useEffect(() => {
    if (mounted.current) {
      try {
        sessionStorage.setItem("omm-inapp-nav", "1");
      } catch {}
    } else {
      mounted.current = true;
    }
    setState((prev) => {
      if (prev !== "loading") return prev;
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setState("idle"), 450);
      return "done";
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  if (state === "idle") return null;

  return <div className={`route-progress route-progress--${state}`} />;
};

export default RouteProgress;
