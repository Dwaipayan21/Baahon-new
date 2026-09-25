import { useEffect, useRef, useState } from "react";
import {
  KOLKATA_CENTER,
  DEFAULT_ZOOM,
} from "../data/constants";
import { MAP_STYLES } from "../utils/mapCanvasUtils";
import KolkataSvgMap from "./KolkataSvgMap";
import UserLocationMarker from "./UserLocationMarker";
import GoogleMapMetroLayer from "./GoogleMapMetroLayer";
import GoogleMapRouteLayer from "./GoogleMapRouteLayer";
import GoogleMapPandalMarkers from "./GoogleMapPandalMarkers";

const GoogleMapCanvas = ({
  pandals = [],
  selectedPandal,
  selectedPandals = [],
  routeSegments = [],
  routeData = null,
  onSelectPandal,
  metroActive = true,
  activeLayer = "roadmap",
  userLocation,
  onMapReady,
  zoom = 1,
}) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  const [loaded, setLoaded] = useState(
    () => typeof window !== "undefined" && !!window.google?.maps
  );

  const [error, setError] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);

  // ---------------------------------------------------------
  // Load Google Maps
  // ---------------------------------------------------------
  useEffect(() => {
    if (loaded || typeof window === "undefined") return;

    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!key) {
      setError(true);
      return;
    }

    const id = "google-maps-script";
    let script = document.getElementById(id);

    const handleLoad = () => setLoaded(true);
    const handleError = () => setError(true);

    if (!script) {
      script = document.createElement("script");
      script.id = id;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}`;
      script.async = true;
      script.defer = true;
      script.onload = handleLoad;
      script.onerror = handleError;

      document.head.appendChild(script);
    } else {
      script.addEventListener("load", handleLoad);
      script.addEventListener("error", handleError);

      return () => {
        script.removeEventListener("load", handleLoad);
        script.removeEventListener("error", handleError);
      };
    }
  }, [loaded]);

  // ---------------------------------------------------------
  // Initialize Google Map
  // ---------------------------------------------------------
  useEffect(() => {
    if (!loaded || !containerRef.current || mapRef.current) return;

    const map = new window.google.maps.Map(containerRef.current, {
      center: KOLKATA_CENTER,
      zoom: DEFAULT_ZOOM,
      styles: MAP_STYLES,
      disableDefaultUI: true,
      gestureHandling: "greedy",
    });

    mapRef.current = map;
    setMapInstance(map);

    onMapReady?.(map);

    return () => {
      mapRef.current = null;
      setMapInstance(null);
    };
  }, [loaded]);

  // ---------------------------------------------------------
  // Map type
  // ---------------------------------------------------------
  useEffect(() => {
    mapRef.current?.setMapTypeId(activeLayer);
  }, [activeLayer]);

  // ---------------------------------------------------------
  // Pan to selected pandal
  // ---------------------------------------------------------
  useEffect(() => {
    if (selectedPandal && mapRef.current) {
      mapRef.current.panTo({
        lat: selectedPandal.lat,
        lng: selectedPandal.lng,
      });
    }
  }, [selectedPandal]);

  // ---------------------------------------------------------
  // Pan to user location
  // ---------------------------------------------------------
  useEffect(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.panTo(userLocation);
      mapRef.current.setZoom(14);
    }
  }, [userLocation]);

  // ---------------------------------------------------------
  // Google Maps fallback
  // ---------------------------------------------------------
  if (!loaded || error) {
    return (
      <KolkataSvgMap
        pandals={pandals}
        selectedPandal={selectedPandal}
        onSelectPandal={onSelectPandal}
        metroActive={metroActive}
        zoom={zoom}
      />
    );
  }

  // ---------------------------------------------------------
  // Google Map
  // ---------------------------------------------------------
  return (
    <>
      <div
        ref={containerRef}
        className="w-full h-full"
      />

      <GoogleMapMetroLayer
        map={mapInstance}
        metroActive={metroActive}
      />

      <GoogleMapRouteLayer
        map={mapInstance}
        routeData={routeData}
        routeSegments={routeSegments}
      />

      <GoogleMapPandalMarkers
        map={mapInstance}
        pandals={pandals}
        selectedPandal={selectedPandal}
        selectedPandals={selectedPandals}
        onSelectPandal={onSelectPandal}
      />

      <UserLocationMarker
        map={mapInstance}
        position={userLocation}
      />
    </>
  );
};

export default GoogleMapCanvas;