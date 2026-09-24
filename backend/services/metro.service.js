import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const metroPath = path.join(
  __dirname,
  "../data/metro"
);

const loadJson = (file) =>
  JSON.parse(
    fs.readFileSync(
      path.join(metroPath, file),
      "utf8"
    )
  );

// ---------------------------------------------
// Load Metro data
// ---------------------------------------------

const stations = [
  ...loadJson("green-line.json"),
  ...loadJson("blue-line.json"),
];

const connections = [
  ...loadJson("green-connections.json"),
  ...loadJson("blue-connections.json"),
];

// ---------------------------------------------
// Station lookup
// ---------------------------------------------

const stationMap = new Map(
  stations.map((station) => [
    station.name,
    station,
  ])
);

// ---------------------------------------------
// Metro graph
// ---------------------------------------------

const graph = new Map();

for (const station of stations) {
  graph.set(station.name, []);
}

// Normal line connections
for (const { from, to, line } of connections) {
  graph.get(from)?.push({
    station: to,
    line,
  });

  graph.get(to)?.push({
    station: from,
    line,
  });
}

// ---------------------------------------------
// Interchange connections
// ---------------------------------------------
//
// Green Esplanade <-> Blue Esplanade
//

const interchanges = [
  {
    from: "Esplanade",
    to: "Esplanade (Line 1)",
  },
];

for (const { from, to } of interchanges) {
  if (!graph.has(from) || !graph.has(to)) {
    continue;
  }

  graph.get(from).push({
    station: to,
    line: "Interchange",
  });

  graph.get(to).push({
    station: from,
    line: "Interchange",
  });
}

// ---------------------------------------------
// Haversine distance
// ---------------------------------------------

const distanceBetween = (
  lat1,
  lng1,
  lat2,
  lng2
) => {
  const R = 6371000;

  const dLat =
    ((lat2 - lat1) * Math.PI) / 180;

  const dLng =
    ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return (
    R *
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );
};

// ---------------------------------------------
// Find nearest station
// ---------------------------------------------

export const findNearestStation = (
  latitude,
  longitude
) => {
  let nearest = null;
  let minDistance = Infinity;

  for (const station of stations) {
    const [lng, lat] =
      station.location.coordinates;

    const distance = distanceBetween(
      latitude,
      longitude,
      lat,
      lng
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearest = station;
    }
  }

  return nearest
    ? {
        station: nearest,
        distance: Math.round(minDistance),
      }
    : null;
};

// ---------------------------------------------
// Find Metro path using BFS
// ---------------------------------------------

export const findMetroPath = (
  startName,
  endName
) => {
  if (
    !graph.has(startName) ||
    !graph.has(endName)
  ) {
    return null;
  }

  if (startName === endName) {
    const station =
      stationMap.get(startName);

    return {
      stations: [station],
      lines: [station.line],
      transfers: 0,
    };
  }

  const queue = [
    {
      station: startName,
      path: [startName],
      lines: [],
    },
  ];

  const visited = new Set([
    startName,
  ]);

  while (queue.length > 0) {
    const current = queue.shift();

    for (const connection of graph.get(
      current.station
    )) {
      if (visited.has(connection.station)) {
        continue;
      }

      const nextPath = [
        ...current.path,
        connection.station,
      ];

      const nextLines =
        connection.line === "Interchange"
          ? current.lines
          : [
              ...current.lines,
              connection.line,
            ];

      if (
        connection.station === endName
      ) {
        const routeStations =
          nextPath.map((name) =>
            stationMap.get(name)
          );

        const uniqueLines = [
          ...new Set(nextLines),
        ];

        return {
          stations: routeStations,
          lines: uniqueLines,
          transfers: Math.max(
            uniqueLines.length - 1,
            0
          ),
        };
      }

      visited.add(connection.station);

      queue.push({
        station: connection.station,
        path: nextPath,
        lines: nextLines,
      });
    }
  }

  return null;
};

// ---------------------------------------------
// Complete Metro route between GPS coordinates
// ---------------------------------------------

export const getMetroRoute = ({
  fromLatitude,
  fromLongitude,
  toLatitude,
  toLongitude,
}) => {
  const from = findNearestStation(
    fromLatitude,
    fromLongitude
  );

  const to = findNearestStation(
    toLatitude,
    toLongitude
  );

  if (!from || !to) {
    return null;
  }

  const metroRoute = findMetroPath(
    from.station.name,
    to.station.name
  );

  if (!metroRoute) {
    return null;
  }

  return {
    fromStation: from.station,
    toStation: to.station,

    walkingToMetro: from.distance,
    walkingFromMetro: to.distance,

    stations: metroRoute.stations,
    lines: metroRoute.lines,
    transfers: metroRoute.transfers,
  };
};