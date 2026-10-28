"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/Loader";
import "@/styles/Splash.css";

const SHOW_AFTER_MS = 300;
const MAX_WAIT_MS = 1500;

const SplashScreen = () => {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (document.readyState === "complete") return;

    let removeTimer;
    let finished = false;

    const showTimer = setTimeout(() => setVisible(true), SHOW_AFTER_MS);

    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(showTimer);
      setFading(true);
      removeTimer = setTimeout(() => setVisible(false), 300);
    };

    const maxWaitTimer = setTimeout(finish, MAX_WAIT_MS);
    window.addEventListener("load", finish);

    return () => {
      window.removeEventListener("load", finish);
      clearTimeout(showTimer);
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
