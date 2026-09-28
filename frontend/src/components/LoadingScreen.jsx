import { useEffect, useRef, useState } from "react";
import "../index.css";
import LoadingPujoArtwork from "./LoadingPujoArtwork";

/*
 * LoadingScreen
 *
 * ready:
 *   false = keep loader visible
 *   true  = allow loader to finish and fade out
 *
 * The original HTML loader uses a 4s animation.
 * We preserve that timing, but React now controls
 * when the loader is actually allowed to disappear.
 */
const LoadingScreen = ({ ready = false, onComplete }) => {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const startTimeRef = useRef(null);
  const hideTimerRef = useRef(null);
  const fadeTimerRef = useRef(null);

  useEffect(() => {
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }

    if (!ready || !visible) return;

    const MINIMUM_DISPLAY_TIME = 3200;
    const ANIMATION_DURATION = 4000;
    const FADE_DURATION = 600;

    const elapsed = Date.now() - startTimeRef.current;

    /*
     * The original loader had a minimum duration of 3200ms.
     * We also wait for the 4-second visual animation to finish
     * so the artwork isn't cut off prematurely.
     */
    const waitTime = Math.max(
      MINIMUM_DISPLAY_TIME,
      ANIMATION_DURATION - elapsed
    );

    hideTimerRef.current = setTimeout(() => {
      setFading(true);

      fadeTimerRef.current = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, FADE_DURATION);
    }, waitTime);

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }

      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
      }
    };
  }, [ready, visible, onComplete]);

  if (!visible) {
    return null;
  }

  return (
    <div
      id="pp"
      className={`pujo-loader${fading ? " is-fading" : ""}`}
      role="status"
      aria-label="Loading PujoPath"
      aria-live="polite"
    >
      <div className="pp-st">
        {/* Top-left alpana */}
        <svg
          className="pp-m pp-m-tl"
          viewBox="-64 -64 128 128"
          aria-hidden="true"
        >
          <use href="#pp-md" />
        </svg>

        {/* Top-right alpana */}
        <svg
          className="pp-m pp-m-tr"
          viewBox="-64 -64 128 128"
          aria-hidden="true"
        >
          <use href="#pp-md" />
        </svg>

        {/* Bottom-left alpana */}
        <svg
          className="pp-m pp-m-bl"
          viewBox="-64 -64 128 128"
          aria-hidden="true"
        >
          <use href="#pp-md" />
        </svg>

        {/* Bottom-right alpana */}
        <svg
          className="pp-m pp-m-br"
          viewBox="-64 688 1048 1066"
          aria-hidden="true"
        >
          <use href="#pp-md" />
        </svg>

        {/* Main PujoPath artwork */}
        <LoadingPujoArtwork />
      </div>

      <i className="pp-sw" aria-hidden="true" />
    </div>
  );
};

export default LoadingScreen;