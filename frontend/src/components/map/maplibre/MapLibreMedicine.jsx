import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import {
  MEDICINE_MARKER_SVG,
  createMarkerElement,
} from "../../../utils/mapLayerIcons";

const MapLibreMedicine = ({
  map,
  medicinesActive = false,
}) => {
  const markersRef = useRef([]);

  useEffect(() => {
    if (!map) return;

    let cancelled = false;

    const clearMarkers = () => {
      markersRef.current.forEach((marker) => {
        marker.remove();
      });

      markersRef.current = [];
    };

    if (!medicinesActive) {
      clearMarkers();
      return;
    }

    const createPopupContent = (properties = {}) => {
      const title =
        properties.name ||
        properties["name:en"] ||
        "Medicine Store";

      const rows = Object.entries(properties)
        .filter(
          ([key, value]) =>
            key !== "@id" &&
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
        )
        .map(
          ([key, value]) => `
            <div style="
              display:flex;
              gap:8px;
              margin-top:6px;
              font-size:12px;
              line-height:1.4;
            ">
              <strong style="
                text-transform:capitalize;
                flex-shrink:0;
              ">
                ${key.replace(/_/g, " ")}
              </strong>

              <span>
                ${String(value)}
              </span>
            </div>
          `
        )
        .join("");

      return `
        <div style="
          min-width:180px;
          max-width:260px;
          padding:4px;
          color:#1f2937;
          font-family:Arial,sans-serif;
        ">
          <div style="
            font-size:15px;
            font-weight:700;
            margin-bottom:6px;
          ">
            ${title}
          </div>

          ${
            rows ||
            `
              <div style="
                font-size:12px;
                color:#6b7280;
              ">
                Medicine store / pharmacy
              </div>
            `
          }
        </div>
      `;
    };

    const loadMedicines = async () => {
      try {
        const response = await fetch(
          "/geojson/medicines.geojson"
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load medicines GeoJSON"
          );
        }

        const data = await response.json();

        if (cancelled) return;

        clearMarkers();

        const features = Array.isArray(data.features)
          ? data.features
          : [];

        features.forEach((feature) => {
          const coordinates =
            feature?.geometry?.coordinates;

          if (
            !Array.isArray(coordinates) ||
            coordinates.length < 2
          ) {
            return;
          }

          const [lng, lat] = coordinates;

          if (
            !Number.isFinite(lng) ||
            !Number.isFinite(lat)
          ) {
            return;
          }

          const properties = feature.properties || {};

          const markerElement =
            createMarkerElement(MEDICINE_MARKER_SVG);

          const popup = new maplibregl.Popup({
            offset: 18,
            closeButton: true,
            closeOnClick: false,
          }).setHTML(
            createPopupContent(properties)
          );

          const marker = new maplibregl.Marker({
            element: markerElement,
            anchor: "center",
          })
            .setLngLat([lng, lat])
            .setPopup(popup)
            .addTo(map);

          markersRef.current.push(marker);
        });
      } catch (error) {
        if (cancelled) return;

        console.error(
          "Failed to load medicine GeoJSON:",
          error
        );
      }
    };

    loadMedicines();

    return () => {
      cancelled = true;
      clearMarkers();
    };
  }, [map, medicinesActive]);

  return null;
};

export default MapLibreMedicine;