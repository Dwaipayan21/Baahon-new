import { useEffect, useRef } from "react";

const ROAD_SOURCE = "route-road";
const ROAD_LAYER = "route-road-layer";

const WALK_SOURCE_PREFIX = "route-walk-";
const WALK_LAYER_PREFIX = "route-walk-layer-";

const METRO_ROUTE_SOURCE = "route-metro-segment";
const METRO_ROUTE_LAYER = "route-metro-segment-layer";

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
  const walkLayerIdsRef = useRef([]);

  useEffect(() => {
    if (!map) {
      return;
    }

    const cleanup = () => {
      removeLayerAndSource(
        map,
        ROAD_LAYER,
        ROAD_SOURCE
      );

      walkLayerIdsRef.current.forEach(
        ({ layerId, sourceId }) => {
          removeLayerAndSource(
            map,
            layerId,
            sourceId
          );
        }
      );

      walkLayerIdsRef.current = [];

      for (let i = 0; i < 10; i++) {
        removeLayerAndSource(
          map,
          `${METRO_ROUTE_LAYER}-${i}`,
          `${METRO_ROUTE_SOURCE}-${i}`
        );
      }
    };

    const addWalkingLayer = (
      geometry,
      idSuffix
    ) => {
      if (!geometry) {
        return;
      }

      const sourceId =
        `${WALK_SOURCE_PREFIX}${idSuffix}`;

      const layerId =
        `${WALK_LAYER_PREFIX}${idSuffix}`;

      upsertSource(
        map,
        sourceId,
        toFeatureCollection(geometry)
      );

      map.addLayer({
        id: layerId,
        type: "line",
        source: sourceId,

        layout: {
          "line-join": "round",
          "line-cap": "round",
        },

        paint: {
          "line-color": "#2563eb",
          "line-width": 4,
          "line-dasharray": [2, 2],
          "line-opacity": 0.9,
        },
      });

      walkLayerIdsRef.current.push({
        layerId,
        sourceId,
      });
    };

    const applyRoutes = async () => {
      cleanup();

      if (!map.isStyleLoaded()) {
        return;
      }

      /* -------------------------------------------------
         Multi-stop walking route
      ------------------------------------------------- */

      if (routeSegments.length > 0) {
        routeSegments.forEach((segment, index) => {
          if (!segment?.geometry) {
            return;
          }

          addWalkingLayer(
            segment.geometry,
            `multi-${index}`
          );
        });

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

          addWalkingLayer(
            toMetroGeom,
            `to-${routeIndex}`
          );

          const fromMetroGeom =
            route.walking?.fromMetro?.geometry;

          addWalkingLayer(
            fromMetroGeom,
            `from-${routeIndex}`
          );

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

            if (metroGeometry) {
              const sourceId =
                `${METRO_ROUTE_SOURCE}-${routeIndex}`;

              const layerId =
                `${METRO_ROUTE_LAYER}-${routeIndex}`;

              upsertSource(
                map,
                sourceId,
                toFeatureCollection(
                  metroGeometry
                )
              );

              const lineColor =
                route.metro?.lines?.[0]?.color ||
                "#005bb3";

              map.addLayer({
                id: layerId,
                type: "line",
                source: sourceId,

                layout: {
                  "line-join": "round",
                  "line-cap": "round",
                },

                paint: {
                  "line-color": lineColor,
                  "line-width": 6,
                  "line-opacity": 0.95,
                },
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

          if (isWalking) {
            addWalkingLayer(
              route.geometry,
              `single-${routeIndex}`
            );
          } else {
            upsertSource(
              map,
              ROAD_SOURCE,
              toFeatureCollection(
                route.geometry
              )
            );

            map.addLayer({
              id: ROAD_LAYER,
              type: "line",
              source: ROAD_SOURCE,

              layout: {
                "line-join": "round",
                "line-cap": "round",
              },

              paint: {
                "line-color": "#2563eb",
                "line-width": 6,
                "line-opacity": 0.95,
              },
            });
          }
        }
      }
    };

    if (map.isStyleLoaded()) {
      applyRoutes();
    } else {
      map.once("load", applyRoutes);
    }

    return cleanup;
  }, [
    map,
    routeData,
    routeSegments,
  ]);

  return null;
};

export default MapLibreRouteLayer;