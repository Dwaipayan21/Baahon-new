import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const KOLKATA_LNG = 88.3639;
const KOLKATA_LAT = 22.5726;
const DEFAULT_ZOOM = 12;
const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

/**
 * MapLibreMap
 *
 * Renders the base MapLibre GL JS map, centered on Kolkata.
 * Positioned absolute to fill its parent. z-index: 0 so React
 * UI overlays (z-10+) render above it.
 * Calls onMapReady(mapInstance) once the style is loaded.
 */
const MapLibreMap = ({ onMapReady }) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: [KOLKATA_LNG, KOLKATA_LAT],
      zoom: DEFAULT_ZOOM,
    });

    mapRef.current = map;

    map.on("load", () => {
      onMapReady?.(map);
    });

    map.on("error", (e) => {
      console.error("MAPLIBRE ERROR:", e);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
      }}
    />
  );
};

export default MapLibreMap;
