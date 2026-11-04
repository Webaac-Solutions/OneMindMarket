import React from "react";
import "./Loader.css";

const Loader = ({ label, fullScreen = false }) => {
  return (
    <div className={`admin-loader ${fullScreen ? "admin-loader--fullscreen" : ""}`}>
      <div className="admin-loader-ring">
        <img
          src="/onemindlogo.png"
          alt="Loading"
          width={44}
          height={44}
          className="admin-loader-logo"
        />
      </div>
      {label && <span className="admin-loader-label">{label}</span>}
    </div>
  );
};

export default Loader;