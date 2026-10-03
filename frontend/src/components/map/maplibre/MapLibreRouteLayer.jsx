import { useEffect, useRef } from "react";

const METRO_FILES = [
  "/metro/blue/blue.geojson",
  "/metro/greenline/greenline.geojson",
  "/metro/orangeline/orangeline.geojson",
  "/metro/yellowline/yellowline.geojson",
  "/metro/purple/purple.geojson",
];

/* -------------------------------------------------------
   Helpers
------------------------------------------------------- */

const toFeatureCollection = (geometry) => ({
  type: "FeatureCollection",
  features: geometry
    ? [
        {
          type: "Feature",
          geometry,
          properties: {},
        },
      ]
    : [],
});

const upsertSource = (map, id, geojson) => {
  if (map.getSource(id)) {
    map.getSource(id).setData(geojson);
  } else {
    map.addSource(id, {
      type: "geojson",
      data: geojson,
    });
  }
};

const removeLayerAndSource = (map, layerId, sourceId) => {
  if (map.getLayer(layerId)) {
    map.removeLayer(layerId);
  }

  if (map.getSource(sourceId)) {
    map.removeSource(sourceId);
  }
};

/* -------------------------------------------------------
   Distance helper
------------------------------------------------------- */

const distanceSquared = (a, b) => {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];

  return dx * dx + dy * dy;
};

/* -------------------------------------------------------
   Get closest point on metro geometry
------------------------------------------------------- */

const findClosestPointIndex = (coordinates, target) => {
  if (!coordinates || coordinates.length === 0) {
    return -1;
  }

  let closestIndex = 0;
  let closestDistance = Infinity;

  coordinates.forEach((coordinate, index) => {
    const distance = distanceSquared(coordinate, target);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
};

/* -------------------------------------------------------
   Extract LineStrings from GeoJSON
------------------------------------------------------- */

const extractLineStrings = (geojson) => {
  const lines = [];

  if (!geojson) {
    return lines;
  }

  if (geojson.type === "FeatureCollection") {
    geojson.features?.forEach((feature) => {
      if (!feature?.geometry) {
        return;
      }

      if (feature.geometry.type === "LineString") {
        lines.push(feature.geometry.coordinates);
      }

      if (feature.geometry.type === "MultiLineString") {
        feature.geometry.coordinates.forEach((line) => {
          lines.push(line);
        });
      }
    });
  }

  if (geojson.type === "Feature") {
    if (geojson.geometry?.type === "LineString") {
      lines.push(geojson.geometry.coordinates);
    }

    if (geojson.geometry?.type === "MultiLineString") {
      geojson.geometry.coordinates.forEach((line) => {
        lines.push(line);
      });
    }
  }

  if (geojson.type === "LineString") {
    lines.push(geojson.coordinates);
  }

  if (geojson.type === "MultiLineString") {
    geojson.coordinates.forEach((line) => {
      lines.push(line);
    });
  }

  return lines;
};

/* -------------------------------------------------------
   Find actual metro geometry between stations
------------------------------------------------------- */

const getMetroGeometry = async (fromCoords, toCoords) => {
  if (!fromCoords || !toCoords) {
    return null;
  }

  try {
    const responses = await Promise.all(
      METRO_FILES.map((file) =>
        fetch(file)
          .then((response) => {
            if (!response.ok) {
              throw new Error(`Failed to load ${file}`);
            }

            return response.json();
          })
          .catch(() => null)
      )
    );

    let bestLine = null;
    let bestScore = Infinity;

    responses.forEach((geojson) => {
      const lines = extractLineStrings(geojson);

      lines.forEach((line) => {
        if (!line || line.length < 2) {
          return;
        }

        const fromIndex = findClosestPointIndex(line, fromCoords);
        const toIndex = findClosestPointIndex(line, toCoords);

        if (fromIndex === -1 || toIndex === -1) {
          return;
        }

        const fromDistance = distanceSquared(
          line[fromIndex],
          fromCoords
        );

        const toDistance = distanceSquared(
          line[toIndex],
          toCoords
        );

        const score = fromDistance + toDistance;

        if (score < bestScore) {
          bestScore = score;

          bestLine = {
            line,
            fromIndex,
            toIndex,
          };
        }
      });
    });

    if (!bestLine) {
      return null;
    }

    const {
      line,
      fromIndex,
      toIndex,
    } = bestLine;

    const start = Math.min(fromIndex, toIndex);
    const end = Math.max(fromIndex, toIndex);

    let coordinates = line.slice(start, end + 1);

    if (fromIndex > toIndex) {
      coordinates.reverse();
    }

    if (coordinates.length < 2) {
      return null;
    }

    return {
      type: "LineString",
      coordinates,
    };
  } catch (error) {
    console.error(
      "Failed to create metro route geometry:",
      error
    );

    return null;
  }
};

/* -------------------------------------------------------
   Component
------------------------------------------------------- */

const MapLibreRouteLayer = ({
  map,
  routeData,
  routeSegments = [],
}) => {
  const routeLayersRef = useRef([]);

  useEffect(() => {
    if (!map) {
      return;
    }

    let cancelled = false;

    const cleanup = () => {
      routeLayersRef.current.forEach(
        ({ layerId, sourceId }) => {
          removeLayerAndSource(
            map,
            layerId,
            sourceId
          );
        }
      );

      routeLayersRef.current = [];
    };

    const addLineLayer = ({
      geometry,
      layerId,
      sourceId,
      color = "#2563eb",
      width = 6,
      opacity = 0.95,
      dotted = false,
    }) => {
      if (!geometry) {
        return;
      }

      const geojson = toFeatureCollection(
        geometry
      );

      upsertSource(
        map,
        sourceId,
        geojson
      );

      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }

      map.addLayer({
        id: layerId,
        type: "line",
        source: sourceId,

        layout: {
          "line-join": "round",
          "line-cap": "round",
        },

        paint: dotted
          ? {
              "line-color": color,
              "line-width": width,
              "line-dasharray": [1, 2],
              "line-opacity": opacity,
            }
          : {
              "line-color": color,
              "line-width": width,
              "line-opacity": opacity,
            },
      });

      routeLayersRef.current.push({
        layerId,
        sourceId,
      });
    };

    const applyRoutes = async () => {
      cleanup();

      if (cancelled || !map.isStyleLoaded()) {
        return;
      }

      if (routeSegments.length > 0) {
        routeSegments.forEach(
          (segment, index) => {
            if (!segment?.geometry) {
              return;
            }

            addLineLayer({
              geometry: segment.geometry,
              layerId: `route-road-layer-${index}`,
              sourceId: `route-road-${index}`,
              color: "#2563eb",
              width: 6,
              opacity: 0.95,
              dotted: false,
            });
          }
        );

        return;
      }

      if (!routeData) {
        return;
      }

      const routes = Array.isArray(routeData)
        ? routeData
        : [routeData];

      for (
        let routeIndex = 0;
        routeIndex < routes.length;
        routeIndex++
      ) {
        if (cancelled) {
          return;
        }

        const route = routes[routeIndex];

        if (!route) {
          continue;
        }

        /* -------------------------------------------------
           METRO + WALK
        ------------------------------------------------- */

        if (route.mode === "metro") {
          const toMetroGeom =
            route.walking?.toMetro?.geometry;

          if (toMetroGeom) {
            addLineLayer({
              geometry: toMetroGeom,
              layerId: `route-walk-to-${routeIndex}`,
              sourceId: `route-walk-to-${routeIndex}`,
              color: "#2563eb",
              width: 3,
              opacity: 0.95,
              dotted: true,
            });
          }

          const fromMetroGeom =
            route.walking?.fromMetro?.geometry;

          if (fromMetroGeom) {
            addLineLayer({
              geometry: fromMetroGeom,
              layerId: `route-walk-from-${routeIndex}`,
              sourceId: `route-walk-from-${routeIndex}`,
              color: "#2563eb",
              width: 3,
              opacity: 0.95,
              dotted: true,
            });
          }

          const fromStation =
            route.metro?.fromStation;

          const toStation =
            route.metro?.toStation;

          const fromCoords =
            fromStation?.location?.coordinates;

          const toCoords =
            toStation?.location?.coordinates;

          if (
            fromCoords &&
            toCoords
          ) {
            const metroGeometry =
              await getMetroGeometry(
                fromCoords,
                toCoords
              );

            if (metroGeometry && !cancelled) {
              const lineColor =
                route.metro?.lines?.[0]
                  ?.color || "#005bb3";

              addLineLayer({
                geometry: metroGeometry,
                layerId: `route-metro-${routeIndex}`,
                sourceId: `route-metro-${routeIndex}`,
                color: lineColor,
                width: 6,
                opacity: 0.95,
                dotted: false,
              });
            }
          }

          continue;
        }

        /* -------------------------------------------------
           WALKING OR ROAD
        ------------------------------------------------- */

        if (route.geometry) {
          const isWalking =
            route.mode === "walking";

          addLineLayer({
            geometry: route.geometry,
            layerId: `route-${route.mode || "road"}-${routeIndex}`,
            sourceId: `route-${route.mode || "road"}-${routeIndex}`,
            color: "#2563eb",
            width: isWalking ? 3 : 6,
            opacity: 0.95,
            dotted: isWalking,
          });
        }
      }
    };

    if (map.isStyleLoaded()) {
      applyRoutes();
    } else {
      map.once("load", applyRoutes);
    }

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [
    map,
    routeData,
    routeSegments,
  ]);

  return null;
};

export default MapLibreRouteLayer;