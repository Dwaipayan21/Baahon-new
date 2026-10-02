import { useEffect, useRef } from "react";
import { METRO_DATA, METRO_GEOJSON } from "../../../data/constants";

const METRO_LINES = [
  { key: "blueLine",   sourceId: "metro-blue",   layerId: "metro-layer-blue"   },
  { key: "greenLine",  sourceId: "metro-green",  layerId: "metro-layer-green"  },
  { key: "yellowLine", sourceId: "metro-yellow", layerId: "metro-layer-yellow" },
  { key: "orangeLine", sourceId: "metro-orange", layerId: "metro-layer-orange" },
  { key: "purpleLine", sourceId: "metro-purple", layerId: "metro-layer-purple" },
];

/**
 * MapLibreMetroLayer
 * Loads each metro GeoJSON as a MapLibre source + line layer.
 * Metro toggle controlled via map.setLayoutProperty(layerId, "visibility", ...).
 */
const MapLibreMetroLayer = ({ map, metroActive = true }) => {
  const loadedRef = useRef(false);

  // Load GeoJSON sources and layers once on map ready
  useEffect(() => {
    if (!map || loadedRef.current) return;

    let cancelled = false;

    const loadLines = async () => {
      // Wait until style is fully loaded
      if (!map.isStyleLoaded()) {
        await new Promise((resolve) => map.once("idle", resolve));
      }

      if (cancelled) return;

      for (const { key, sourceId, layerId } of METRO_LINES) {
        const lineData = METRO_DATA[key];
        if (!lineData) continue;

        const geojsonUrl = METRO_GEOJSON[key];
        if (!geojsonUrl) continue;

        try {
          const res = await fetch(geojsonUrl);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const geojson = await res.json();

          if (cancelled) return;
          if (map.getSource(sourceId)) continue; // already added

          map.addSource(sourceId, {
            type: "geojson",
            data: geojson,
          });

          map.addLayer({
            id: layerId,
            type: "line",
            source: sourceId,
            layout: {
              "line-join": "round",
              "line-cap": "round",
              visibility: metroActive ? "visible" : "none",
            },
            paint: {
              "line-color": lineData.color,
              "line-width": 4,
              "line-opacity": 0.95,
            },
          });
        } catch (err) {
          console.error(`MapLibreMetroLayer: failed to load ${key}:`, err);
        }
      }

      loadedRef.current = true;
    };

    loadLines();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // Toggle visibility when metroActive changes
  useEffect(() => {
    if (!map || !loadedRef.current) return;

    const visibility = metroActive ? "visible" : "none";

    METRO_LINES.forEach(({ layerId }) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, "visibility", visibility);
      }
    });
  }, [map, metroActive]);

  return null;
};

export default MapLibreMetroLayer;
