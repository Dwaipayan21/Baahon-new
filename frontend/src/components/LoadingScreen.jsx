import { useEffect, useState } from "react";
import "../index.css";

const VIDEO_DURATION = 7000;
const FADE_DURATION = 2000;

const LoadingScreen = () => {
  const [fading, setFading] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, VIDEO_DURATION);

    const removeTimer = setTimeout(() => {
      setVisible(false);
    }, VIDEO_DURATION + FADE_DURATION);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={`baahon-loading-screen${
        fading ? " is-fading" : ""
      }`}
    >
      <video
        className="baahon-loading-video"
        src="/loading.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
      />
    </div>
  );
};

export default LoadingScreen;