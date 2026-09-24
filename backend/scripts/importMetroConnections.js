import fs from "fs";
import path from "path";
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
});

const files = ["green.xml", "green1.xml"];

const getArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const normalizeName = (name) =>
  name
    .replace(/\s*\(Line 2\)\s*/i, "")
    .trim();

const stationMap = new Map();

const connections = new Map();

for (const file of files) {
  const filePath = path.resolve("data/metro", file);

  console.log(`Reading ${file}...`);

  const xml = fs.readFileSync(filePath, "utf8");
  const osm = parser.parse(xml).osm;

  const nodes = getArray(osm.node);
  const relations = getArray(osm.relation);

  const nodeMap = new Map(
    nodes.map((node) => [String(node["@_id"]), node])
  );

  const relation = relations.find((item) =>
    getArray(item.member).some(
      (member) =>
        member["@_type"] === "node" &&
        member["@_role"] === "stop"
    )
  );

  if (!relation) {
    console.log(`No stop relation found in ${file}`);
    continue;
  }

  const orderedStations = [];

  for (const member of getArray(relation.member)) {
    if (
      member["@_type"] !== "node" ||
      member["@_role"] !== "stop"
    ) {
      continue;
    }

    const node = nodeMap.get(String(member["@_ref"]));

    if (!node) continue;

    const tags = Object.fromEntries(
      getArray(node.tag).map((tag) => [
        tag["@_k"],
        tag["@_v"],
      ])
    );

    if (!tags.name) continue;

    const name = normalizeName(tags.name);

    if (!stationMap.has(name)) {
      stationMap.set(name, {
        id: name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
        name,
        line: "Green",
        location: {
          type: "Point",
          coordinates: [
            Number(node["@_lon"]),
            Number(node["@_lat"]),
          ],
        },
      });
    }

    orderedStations.push(name);
  }

  // Remove accidental duplicates inside one direction
  const uniqueStations = [
    ...new Set(orderedStations),
  ];

  for (let i = 0; i < uniqueStations.length - 1; i++) {
    const from = uniqueStations[i];
    const to = uniqueStations[i + 1];

    const key = [from, to].sort().join("|");

    connections.set(key, {
      from,
      to,
      line: "Green",
    });
  }
}

const output = [...connections.values()];

const outputPath = path.resolve(
  "data/metro/green-connections.json"
);

fs.writeFileSync(
  outputPath,
  JSON.stringify(output, null, 2)
);

console.log(`\nCreated ${output.length} connections.`);
console.log(`Saved to: ${outputPath}`);