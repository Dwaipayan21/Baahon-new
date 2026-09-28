import { useEffect, useRef } from "react";
import { geoJsonToGooglePath } from "../utils/mapCanvasUtils";

const GoogleMapRouteLayer = ({
  map,
  routeData = null,
  routeSegments = [],
}) => {
  const routeLinesRef = useRef([]);

  useEffect(() => {
    if (!map || !window.google?.maps) return;

    // Remove previous route lines
    routeLinesRef.current.forEach((line) => {
      line.setMap(null);
    });

    routeLinesRef.current = [];

    const routes = Array.isArray(routeData)
      ? routeData
      : routeData
        ? [routeData]
        : [];

    const geometries = [
      ...routeSegments.map((segment) => ({
        geometry: segment?.geometry,
        strokeColor: "#2563eb",
        isWalking: false,
      })),
      ...routes.flatMap((route) => {
        if (route?.mode === "metro") {
          return [
            {
              geometry: route.walking?.toMetro?.geometry,
              strokeColor: "#2563eb",
              isWalking: true,
            },
            {
              geometry: route.walking?.fromMetro?.geometry,
              strokeColor: "#2563eb",
              isWalking: true,
            },
          ];
        }

        return [
          {
            geometry: route?.geometry,
            strokeColor: "#2563eb",
            isWalking: false,
          },
        ];
      }),
    ].filter(({ geometry }) => geometry);

    if (!geometries.length) return;

    geometries.forEach(({ geometry, strokeColor, isWalking }) => {
      const paths = geoJsonToGooglePath({
        type: "Feature",
        geometry,
      });

      paths.forEach((path) => {
        if (path.length < 2) return;

        const routeLine = new window.google.maps.Polyline({
          path,
          geodesic: false,
          strokeColor: isWalking ? "transparent" : strokeColor,
          strokeOpacity: isWalking ? 0 : 0.95,
          strokeWeight: isWalking ? 0 : 6,
          zIndex: 10,
          map,
          icons: isWalking
            ? [
                {
                  icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    strokeOpacity: "#2563eb",
                    fillOpacity: 1,
                    fillColor: "#2563eb",
                    strokeWeight: 4,
                    scale: 3,
                  },
                  offset: "0",
                  repeat: "10px",
                },
              ]
            : undefined,
        });

        routeLinesRef.current.push(routeLine);
      });
    });

    return () => {
      routeLinesRef.current.forEach((line) => {
        line.setMap(null);
      });

      routeLinesRef.current = [];
    };
  }, [routeData, routeSegments, map]);

  return null;
};

export default GoogleMapRouteLayer;
