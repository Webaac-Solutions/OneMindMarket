import Image from "next/image";
import "@/styles/Loader.css";

const Loader = ({ fullScreen = false }) => {
  return (
    <div className={`site-loader ${fullScreen ? "site-loader--fullscreen" : ""}`}>
      <div className="site-loader-ring">
        <Image
          src="/onemindlogo.png"
          alt="Loading"
          width={44}
          height={44}
          className="site-loader-logo"
          priority
        />
      </div>
    </div>
  );
};

export default Loader;
