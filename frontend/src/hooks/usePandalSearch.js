import { useEffect, useMemo, useState } from "react";
import { normalizeSearchText } from "../utils/searchUtils";
import { METRO_GEOJSON } from "../data/constants";

const METRO_DISTANCE_LIMIT_METERS = 2000;

/*
 * Extract all LineString coordinate arrays from GeoJSON.
 */
const extractMetroLines = (geojson) => {
  const lines = [];

  const processGeometry = (geometry) => {
    if (!geometry) {
      return;
    }

    if (geometry.type === "LineString") {
      lines.push(geometry.coordinates);
      return;
    }

    if (geometry.type === "MultiLineString") {
      geometry.coordinates?.forEach((line) => {
        lines.push(line);
      });
    }
  };

  if (geojson?.type === "FeatureCollection") {
    geojson.features?.forEach((feature) => {
      processGeometry(feature.geometry);
    });
  } else if (geojson?.type === "Feature") {
    processGeometry(geojson.geometry);
  } else if (geojson) {
    processGeometry(geojson);
  }

  return lines;
};

/*
 * Convert latitude/longitude into a local meter-based coordinate system.
 *
 * This is accurate enough for a 2 km radius around Kolkata.
 */
const toLocalMeters = (latitude, longitude, referenceLatitude) => {
  const earthRadius = 6371000;

  const latRadians = (latitude * Math.PI) / 180;
  const referenceLatRadians =
    (referenceLatitude * Math.PI) / 180;

  const x =
    (longitude * Math.PI) /
    180 *
    earthRadius *
    Math.cos(referenceLatRadians);

  const y =
    (latitude * Math.PI) /
    180 *
    earthRadius;

  return { x, y };
};

/*
 * Calculate the shortest distance from a point to a line segment.
 */
const distanceToSegment = (point, start, end) => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  if (dx === 0 && dy === 0) {
    return Math.hypot(
      point.x - start.x,
      point.y - start.y
    );
  }

  const t =
    ((point.x - start.x) * dx +
      (point.y - start.y) * dy) /
    (dx * dx + dy * dy);

  const clampedT = Math.max(0, Math.min(1, t));

  const closestX = start.x + clampedT * dx;
  const closestY = start.y + clampedT * dy;

  return Math.hypot(
    point.x - closestX,
    point.y - closestY
  );
};

/*
 * Calculate the minimum distance from a pandal
 * to any metro line.
 */
const distanceToMetroLines = (pandal, metroLines) => {
  const latitude = Number(
    pandal?.lat ??
      pandal?.latitude ??
      pandal?.location?.coordinates?.[1]
  );

  const longitude = Number(
    pandal?.lng ??
      pandal?.longitude ??
      pandal?.location?.coordinates?.[0]
  );

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return Infinity;
  }

  if (!metroLines.length) {
    return Infinity;
  }

  let minimumDistance = Infinity;

  for (const line of metroLines) {
    if (!Array.isArray(line) || line.length < 2) {
      continue;
    }

    for (let index = 0; index < line.length - 1; index++) {
      const coordinateA = line[index];
      const coordinateB = line[index + 1];

      if (
        !Array.isArray(coordinateA) ||
        !Array.isArray(coordinateB)
      ) {
        continue;
      }

      const referenceLatitude = latitude;

      const point = toLocalMeters(
        latitude,
        longitude,
        referenceLatitude
      );

      const start = toLocalMeters(
        Number(coordinateA[1]),
        Number(coordinateA[0]),
        referenceLatitude
      );

      const end = toLocalMeters(
        Number(coordinateB[1]),
        Number(coordinateB[0]),
        referenceLatitude
      );

      const distance = distanceToSegment(
        point,
        start,
        end
      );

      if (distance < minimumDistance) {
        minimumDistance = distance;
      }

      /*
       * We already know this pandal is inside
       * the 2 km limit, so there is no need to
       * inspect every remaining segment.
       */
      if (
        minimumDistance <=
        METRO_DISTANCE_LIMIT_METERS
      ) {
        return minimumDistance;
      }
    }
  }

  return minimumDistance;
};

export const usePandalSearch = ({
  pandals,
  searchQuery,
  activeCategory,
}) => {
  const [metroLines, setMetroLines] = useState([]);
  const [metroLoading, setMetroLoading] = useState(true);

  /*
   * Load the same GeoJSON files already used
   * by the map's metro layer.
   */
  useEffect(() => {
    let cancelled = false;

    const loadMetroLines = async () => {
      try {
        setMetroLoading(true);

        const responses = await Promise.all(
          Object.values(METRO_GEOJSON).map((url) =>
            fetch(url)
          )
        );

        const invalidResponse = responses.find(
          (response) => !response.ok
        );

        if (invalidResponse) {
          throw new Error(
            "Failed to load metro GeoJSON"
          );
        }

        const geojsonData = await Promise.all(
          responses.map((response) =>
            response.json()
          )
        );

        const lines = geojsonData.flatMap(
          extractMetroLines
        );

        if (!cancelled) {
          setMetroLines(lines);
        }
      } catch (error) {
        console.error(
          "Failed to load metro line data:",
          error
        );

        if (!cancelled) {
          setMetroLines([]);
        }
      } finally {
        if (!cancelled) {
          setMetroLoading(false);
        }
      }
    };

    loadMetroLines();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredPandals = useMemo(() => {
    const query = normalizeSearchText(searchQuery);

    const queryWords = query
      ? query.split(" ").filter(Boolean)
      : [];

    const results = pandals
      .filter((pandal) => {
        /*
         * ALL PANDALS
         */
        if (
          activeCategory === "all" ||
          !activeCategory
        ) {
          // No category filtering.
        }

        /*
         * NEARBY METRO
         *
         * Show every pandal within 2 km
         * of an actual metro-line geometry.
         */
        if (activeCategory === "metro") {
          if (metroLoading) {
            return false;
          }

          const distance =
            distanceToMetroLines(
              pandal,
              metroLines
            );

          if (
            distance >
            METRO_DISTANCE_LIMIT_METERS
          ) {
            return false;
          }
        }

        /*
         * LOW RUSH
         */
        if (activeCategory === "low_rush") {
          const crowdStatus = String(
             pandal.crowdStatus || ""
          )
             .toUpperCase()
            .trim();

           if (crowdStatus !== "LOW") {
             return false;
          }
        }

        /*
         * BONEDI BARI
         *
         * Your sheet uses:
         * category = "traditional"
         */
        if (activeCategory === "bonedi") {
          if (
            String(pandal.category)
              .toLowerCase()
              .trim() !== "traditional"
          ) {
            return false;
          }
        }

        /*
         * THEME PANDALS
         *
         * Your requested definition:
         * theme OR community
         */
        if (activeCategory === "theme") {
          const category = String(
            pandal.category || ""
          )
            .toLowerCase()
            .trim();

          if (
            category !== "theme" &&
            category !== "community"
          ) {
            return false;
          }
        }

        /*
         * Keep support for the existing
         * traditional category if anything
         * else in the app uses it.
         */
        if (activeCategory === "traditional") {
          if (
            String(pandal.category)
              .toLowerCase()
              .trim() !== "traditional"
          ) {
            return false;
          }
        }

        /*
         * SEARCH
         */
        if (queryWords.length === 0) {
          return true;
        }

        const searchableFields = [
          normalizeSearchText(pandal.name),
          normalizeSearchText(pandal.area),
          normalizeSearchText(pandal.address),
          normalizeSearchText(pandal.metroStation),
          normalizeSearchText(pandal.category),
          normalizeSearchText(pandal.crowdStatus),
        ];

        return queryWords.every((word) =>
          searchableFields.some((field) =>
            field.includes(word)
          )
        );
      })
      .map((pandal) => {
        if (queryWords.length === 0) {
          return {
            pandal,
            score: 0,
          };
        }

        const name = normalizeSearchText(
          pandal.name
        );

        const area = normalizeSearchText(
          pandal.area
        );

        const address = normalizeSearchText(
          pandal.address
        );

        const metroStation =
          normalizeSearchText(
            pandal.metroStation
          );

        const category = normalizeSearchText(
          pandal.category
        );

        let score = 0;

        for (const word of queryWords) {
          if (name === word) {
            score += 100;
          } else if (name.startsWith(word)) {
            score += 70;
          } else if (name.includes(word)) {
            score += 50;
          }

          if (area === word) {
            score += 45;
          } else if (area.startsWith(word)) {
            score += 35;
          } else if (area.includes(word)) {
            score += 25;
          }

          if (metroStation === word) {
            score += 40;
          } else if (metroStation.includes(word)) {
            score += 25;
          }

          if (address.includes(word)) {
            score += 15;
          }

          if (category.includes(word)) {
            score += 10;
          }
        }

        return {
          pandal,
          score,
        };
      })
      .sort(
        (first, second) =>
          second.score - first.score
      )
      .map(({ pandal }) => pandal);

    return results;
  }, [
    pandals,
    searchQuery,
    activeCategory,
    metroLines,
    metroLoading,
  ]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    return filteredPandals.slice(0, 6);
  }, [filteredPandals, searchQuery]);

  return {
    filteredPandals,
    searchResults,
  };
};