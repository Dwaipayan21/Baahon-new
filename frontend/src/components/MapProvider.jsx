import { useCallback, useEffect, useRef, useState } from "react";
import GoogleMapCanvas from "./map/google-maps/GoogleMapCanvas";
import MapLibreCanvas from "./map/maplibre/MapLibreCanvas";

const GOOGLE_RETRY_INTERVAL = 30000;
const GOOGLE_LOAD_TIMEOUT = 10000;

const MapProvider = ({
  pandals = [],
  selectedPandal,
  selectedPandals = [],
  routeSegments = [],
  routeData = null,
  onSelectPandal,
  metroActive = true,
  activeLayer = "roadmap",
  userLocation,
  mapRef,
}) => {
  const [provider, setProvider] = useState("google");
  const [googleReady, setGoogleReady] = useState(false);
  const [googleAttempt, setGoogleAttempt] = useState(0);

  const googleCheckRef = useRef(null);
  const googleCheckRunningRef = useRef(false);

  // ---------------------------------------------------------
  // Google became ready
  // ---------------------------------------------------------
  const handleGoogleReady = useCallback((map) => {
    if (!map) return;

    setGoogleReady(true);
    setProvider("google");
  }, []);

  // ---------------------------------------------------------
  // Google failed
  // ---------------------------------------------------------
  const handleGoogleFailure = useCallback(() => {
    setGoogleReady(false);
    setProvider("osm");
  }, []);

  // ---------------------------------------------------------
  // Check whether Google Maps is actually available
  // ---------------------------------------------------------
  const checkGoogleAvailability = useCallback(() => {
    if (googleCheckRunningRef.current) {
      return;
    }

    googleCheckRunningRef.current = true;

    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!key) {
      googleCheckRunningRef.current = false;
      setGoogleReady(false);
      setProvider("osm");
      return;
    }

    // If Google Maps API is already loaded, try mounting
    // GoogleMapCanvas again. Its onMapReady callback will
    // confirm that a map instance can actually be created.
    const existingGoogle =
      typeof window !== "undefined" &&
      window.google?.maps;

    if (existingGoogle) {
      setGoogleReady(true);
      setProvider("google");
      setGoogleAttempt((attempt) => attempt + 1);
      googleCheckRunningRef.current = false;
      return;
    }

    // Otherwise load the Google Maps script temporarily.
    const existingScript = document.getElementById(
      "google-maps-script"
    );

    if (existingScript) {
      const timeout = setTimeout(() => {
        googleCheckRunningRef.current = false;

        if (!window.google?.maps) {
          setGoogleReady(false);
          setProvider("osm");
        }
      }, GOOGLE_LOAD_TIMEOUT);

      const handleLoad = () => {
        clearTimeout(timeout);

        googleCheckRunningRef.current = false;

        if (window.google?.maps) {
          setGoogleReady(true);
          setProvider("google");
          setGoogleAttempt((attempt) => attempt + 1);
        } else {
          setGoogleReady(false);
          setProvider("osm");
        }
      };

      existingScript.addEventListener("load", handleLoad, {
        once: true,
      });

      return;
    }

    const script = document.createElement("script");

    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}`;
    script.async = true;
    script.defer = true;

    const timeout = setTimeout(() => {
      googleCheckRunningRef.current = false;

      if (!window.google?.maps) {
        setGoogleReady(false);
        setProvider("osm");
      }
    }, GOOGLE_LOAD_TIMEOUT);

    script.onload = () => {
      clearTimeout(timeout);

      googleCheckRunningRef.current = false;

      if (window.google?.maps) {
        setGoogleReady(true);
        setProvider("google");
        setGoogleAttempt((attempt) => attempt + 1);
      } else {
        setGoogleReady(false);
        setProvider("osm");
      }
    };

    script.onerror = () => {
      clearTimeout(timeout);

      googleCheckRunningRef.current = false;
      setGoogleReady(false);
      setProvider("osm");
    };

    document.head.appendChild(script);
  }, []);

  // ---------------------------------------------------------
  // Initial Google attempt
  // ---------------------------------------------------------
  useEffect(() => {
    checkGoogleAvailability();
  }, [checkGoogleAvailability]);

  // ---------------------------------------------------------
  // Keep checking Google while using OSM
  // ---------------------------------------------------------
  useEffect(() => {
    if (provider !== "osm") {
      if (googleCheckRef.current) {
        clearInterval(googleCheckRef.current);
        googleCheckRef.current = null;
      }

      return;
    }

    googleCheckRef.current = setInterval(() => {
      checkGoogleAvailability();
    }, GOOGLE_RETRY_INTERVAL);

    return () => {
      if (googleCheckRef.current) {
        clearInterval(googleCheckRef.current);
        googleCheckRef.current = null;
      }
    };
  }, [provider, checkGoogleAvailability]);

  // ---------------------------------------------------------
  // Render Google
  // ---------------------------------------------------------
  if (provider === "google" && googleReady) {
    return (
      <GoogleMapCanvas
        key={`google-${googleAttempt}`}
        pandals={pandals}
        selectedPandal={selectedPandal}
        selectedPandals={selectedPandals}
        routeSegments={routeSegments}
        routeData={routeData}
        onSelectPandal={onSelectPandal}
        metroActive={metroActive}
        activeLayer={activeLayer}
        userLocation={userLocation}
        onMapReady={handleGoogleReady}
        onMapError={handleGoogleFailure}
      />
    );
  }

  // ---------------------------------------------------------
  // OSM / MapLibre fallback
  // ---------------------------------------------------------
  return (
    <MapLibreCanvas
      ref={mapRef}
      pandals={pandals}
      selectedPandal={selectedPandal}
      selectedPandals={selectedPandals}
      routeSegments={routeSegments}
      routeData={routeData}
      onSelectPandal={onSelectPandal}
      metroActive={metroActive}
      userLocation={userLocation}
    />
  );
};

export default MapProvider;