"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/Loader";
import "@/styles/Splash.css";

const MIN_VISIBLE_MS = 600;
const MAX_WAIT_MS = 1500;

const SplashScreen = () => {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const start = Date.now();
    let fadeTimer;
    let removeTimer;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      const elapsed = Date.now() - start;
      const wait = Math.max(MIN_VISIBLE_MS - elapsed, 0);
      fadeTimer = setTimeout(() => setFading(true), wait);
      removeTimer = setTimeout(() => setVisible(false), wait + 400);
    };

    const maxWaitTimer = setTimeout(finish, MAX_WAIT_MS);

    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish);
    }

    return () => {
      window.removeEventListener("load", finish);
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
      clearTimeout(maxWaitTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`splash-screen ${fading ? "splash-screen--fading" : ""}`}>
      <Loader fullScreen />
    </div>
  );
};

export default SplashScreen;
