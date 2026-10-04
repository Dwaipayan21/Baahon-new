import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = path.join(
  __dirname,
  "../data/pandals.json"
);

const OUTPUT_FILE = path.join(
  __dirname,
  "../data/crowdSamplePoints.generated.json"
);

const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

const MIN_DISTANCE = 300;
const MAX_DISTANCE = 800;
const TARGET_POINTS = 5;

const ROAD_TYPES = [
  "trunk",
  "trunk_link",
  "primary",
  "primary_link",
  "secondary",
  "secondary_link",
  "tertiary",
  "tertiary_link",
];

function distanceMeters(
  lat1,
  lon1,
  lat2,
  lon2
) {
  const R = 6371000;

  const toRad = (value) =>
    (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return (
    2 *
    R *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );
}

function parsePandals(rawPandals) {
  return rawPandals.map((pandal) => ({
    name: pandal.name,

    latitude: Number(
      pandal["location/coordinates/1"]
    ),

    longitude: Number(
      pandal["location/coordinates/0"]
    ),
  }));
}

function calculateRoadPointDistance(
  pandal,
  latitude,
  longitude
) {
  return distanceMeters(
    pandal.latitude,
    pandal.longitude,
    latitude,
    longitude
  );
}

async function fetchRoads(pandal) {
    const roadTypesPattern =
        ROAD_TYPES.join("|");

    const query = `
    [out:json][timeout:30];

    way(
    around:${MAX_DISTANCE},
    ${pandal.latitude},
    ${pandal.longitude}
    )
    ["highway"~"^(${roadTypesPattern})$"];

    out tags center;
    `;

    let lastError = null;

    for (const endpoint of OVERPASS_URLS) {
        try {
        console.log(
            `  Trying Overpass: ${endpoint}`
        );

        const url =
            `${endpoint}?data=${encodeURIComponent(query)}`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
            Accept: "application/json",
            "User-Agent":
                "Baahon/1.0 (Durga Puja student project)",
            },
        });

        if (!response.ok) {
            const errorText =
            await response.text();

            lastError = new Error(
            `${response.status} ${response.statusText}: ${errorText.slice(
                0,
                150
            )}`
            );

            continue;
        }

        const data =
            await response.json();

        return data.elements || [];
        } catch (error) {
        lastError = error;
        }

        // Give the next endpoint a little breathing room.
        await new Promise((resolve) =>
        setTimeout(resolve, 4000)
        );
    }

    throw new Error(
        `All Overpass endpoints failed. Last error: ${lastError?.message}`
    );
    }

    function makeCandidates(
    pandal,
    roads
    ) {
    const candidates = [];

    for (const road of roads) {
        if (!road.center) {
        continue;
        }

        const latitude =
        road.center.lat;

        const longitude =
        road.center.lon;

        const distance =
        calculateRoadPointDistance(
            pandal,
            latitude,
            longitude
        );

        if (
        distance < MIN_DISTANCE ||
        distance > MAX_DISTANCE
        ) {
        continue;
        }

        const tags = road.tags || {};

        candidates.push({
        roadId: road.id,

        name:
            tags.name ||
            "Unnamed road",

        highway:
            tags.highway,

        latitude,

        longitude,

        distanceMeters:
            Math.round(distance),
        });
    }

    return candidates;
    }

    function roadPriority(
    highway
    ) {
    switch (highway) {
        case "trunk":
        case "trunk_link":
        return 5;

        case "primary":
        case "primary_link":
        return 4;

        case "secondary":
        case "secondary_link":
        return 3;

        case "tertiary":
        case "tertiary_link":
        return 2;

        default:
        return 1;
    }
    }

function selectCandidates(candidates) {
  const sorted = [...candidates].sort((a, b) => {
    const priorityDifference =
      roadPriority(b.highway) -
      roadPriority(a.highway);

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    const targetDistance = 550;

    return (
      Math.abs(a.distanceMeters - targetDistance) -
      Math.abs(b.distanceMeters - targetDistance)
    );
  });

  const selected = [];

  const MIN_SAMPLE_POINT_DISTANCE = 150;

  for (const candidate of sorted) {
    const sameRoad = selected.some(
      (point) =>
        point.name === candidate.name &&
        point.highway === candidate.highway
    );

    if (sameRoad) {
      continue;
    }

    const tooClose = selected.some(
      (point) =>
        distanceMeters(
          point.latitude,
          point.longitude,
          candidate.latitude,
          candidate.longitude
        ) < MIN_SAMPLE_POINT_DISTANCE
    );

    if (tooClose) {
      continue;
    }

    selected.push(candidate);

    if (selected.length >= TARGET_POINTS) {
      break;
    }
  }

  return selected;
}

async function main() {
  try {
    const raw = JSON.parse(
      await fs.readFile(
        INPUT_FILE,
        "utf8"
      )
    );

    const pandals =
      parsePandals(raw);

    console.log(
      `Processing ${pandals.length} pandals...\n`
    );

    const output = {};

    for (
      const pandal of pandals
    ) {
      console.log(
        `Searching roads for: ${pandal.name}`
      );

      try {
        const roads =
          await fetchRoads(
            pandal
          );

        const candidates =
          makeCandidates(
            pandal,
            roads
          );

        const selected =
          selectCandidates(
            candidates
          );

        output[
          pandal.name
        ] = selected.map(
          (point) => ({
            name:
              point.name,

            location: {
              type: "Point",

              coordinates: [
                point.longitude,
                point.latitude,
              ],
            },

            weight:
              roadPriority(
                point.highway
              ) >= 4
                ? 1.2
                : 1,

            enabled: true,

            source:
              "OpenStreetMap/Overpass",

            highway:
              point.highway,

            distanceMeters:
              point.distanceMeters,
          })
        );

        console.log(
          `  Candidates: ${candidates.length}`
        );

        console.log(
          `  Selected: ${selected.length}`
        );

        if (
          selected.length === 0
        ) {
          console.log(
            "  WARNING: No suitable road candidates found."
          );
        }
      } catch (error) {
        console.error(
          `  Failed: ${error.message}`
        );

        output[
          pandal.name
        ] = [];
      }

      // Avoid sending requests too quickly
      // to the public Overpass service.
      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            1000
          )
      );
    }

    await fs.writeFile(
      OUTPUT_FILE,
      JSON.stringify(
        output,
        null,
        2
      ),
      "utf8"
    );

    console.log(
      `\nGenerated: ${OUTPUT_FILE}`
    );
  } catch (error) {
    console.error(
      "Generator failed:",
      error.message
    );

    process.exit(1);
  }
}

main();