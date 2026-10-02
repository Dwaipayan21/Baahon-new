import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";

/**
 * MapLibreUserLocation
 * Renders the user location as a pulsing blue dot HTML marker.
 * Uses existing userLocation {lat, lng} state from App.jsx.
 * Does NOT create its own geolocation watch.
 */
const MapLibreUserLocation = ({ map, position }) => {
  const markerRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    if (!position) {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }

    // Create the marker element
    const el = document.createElement("div");
    el.style.cssText = `
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #4285F4;
      border: 3px solid #ffffff;
      box-shadow: 0 0 0 3px rgba(66,133,244,0.3);
      animation: pulse-location 2s ease-in-out infinite;
    `;

    // Inject pulse keyframes once
    if (!document.getElementById("mloc-style")) {
      const style = document.createElement("style");
      style.id = "mloc-style";
      style.textContent = `
        @keyframes pulse-location {
          0%   { box-shadow: 0 0 0 3px rgba(66,133,244,0.3); }
          50%  { box-shadow: 0 0 0 8px rgba(66,133,244,0.1); }
          100% { box-shadow: 0 0 0 3px rgba(66,133,244,0.3); }
        }
      `;
      document.head.appendChild(style);
    }

    if (!markerRef.current) {
      markerRef.current = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([position.lng, position.lat])
        .addTo(map);
    } else {
      markerRef.current.setLngLat([position.lng, position.lat]);
    }

    return () => {
      // Keep marker alive across position updates — only remove on unmount
    };
  }, [map, position]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  }, []);

  return null;
};

export default MapLibreUserLocation;
