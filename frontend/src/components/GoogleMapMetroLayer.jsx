import { useEffect, useRef } from "react";
import { METRO_DATA, METRO_GEOJSON } from "../data/constants";
import { geoJsonToGooglePath } from "../utils/mapCanvasUtils";

const GoogleMapMetroLayer = ({ map, metroActive = true }) => {
  const metroLinesRef = useRef([]);
  const metroActiveRef = useRef(metroActive);

  useEffect(() => {
    if (!map || !window.google?.maps) return;

    metroLinesRef.current.forEach((line) => {
      line.setMap(null);
    });

    metroLinesRef.current = [];

    const lines = [
      ["blueLine", METRO_DATA.blueLine],
      ["greenLine", METRO_DATA.greenLine],
      ["yellowLine", METRO_DATA.yellowLine],
      ["orangeLine", METRO_DATA.orangeLine],
      ["purpleLine", METRO_DATA.purpleLine],
    ];

    let cancelled = false;

    const loadMetroLines = async () => {
      for (const [lineKey, line] of lines) {
        if (!line) continue;

        try {
          const response = await fetch(METRO_GEOJSON[lineKey]);

          if (!response.ok) {
            throw new Error(`Failed to load ${METRO_GEOJSON[lineKey]}`);
          }

          const geojson = await response.json();
          const paths = geoJsonToGooglePath(geojson);

          if (cancelled) return;

          paths.forEach((path) => {
            if (path.length < 2) return;

            const polyline = new window.google.maps.Polyline({
              path,
              geodesic: false,
              strokeColor: line.color,
              strokeOpacity: 0.95,
              strokeWeight: 5,
              map: metroActiveRef.current ? map : null,
            });

            metroLinesRef.current.push(polyline);
          });
        } catch (error) {
          console.error(`Error loading ${line.name}:`, error);
        }
      }
    };

    loadMetroLines();

    return () => {
      cancelled = true;

      metroLinesRef.current.forEach((line) => {
        line.setMap(null);
      });

      metroLinesRef.current = [];
    };
  }, [map]);

  useEffect(() => {
    metroActiveRef.current = metroActive;

    if (!map) return;

    metroLinesRef.current.forEach((line) => {
      line.setMap(metroActiveRef.current ? map : null);
    });
  }, [map, metroActive]);

  return null;
};

export default GoogleMapMetroLayer;
