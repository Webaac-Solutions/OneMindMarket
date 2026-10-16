"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/Loader";

const AboutLoadGate = () => {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const img = document.querySelector(".about-hero-gif");
    if (!img || img.complete) {
      setDone(true);
      return;
    }
    const finish = () => setDone(true);
    img.addEventListener("load", finish);
    img.addEventListener("error", finish);
    const timer = setTimeout(finish, 5000);
    return () => {
      img.removeEventListener("load", finish);
      img.removeEventListener("error", finish);
      clearTimeout(timer);
    };
  }, []);

  if (done) return null;

  return (
    <div className="about-loader-overlay">
      <Loader fullScreen />
    </div>
  );
};

export default AboutLoadGate;
