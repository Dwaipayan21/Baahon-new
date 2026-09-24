import fs from "fs";
import path from "path";
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
});

const files = ["blue.xml", "blue1.xml"];

const outputPath = path.resolve(
  "data/metro",
  "blue-line.json"
);

const getArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const normalizeName = (name) =>
  name
    .replace(/\s*\(Line 2\)\s*/i, "")
    .trim();

const stations = new Map();

for (const file of files) {
  const inputPath = path.resolve("data/metro", file);

  console.log(`Reading ${file}...`);

  if (!fs.existsSync(inputPath)) {
    console.error(`File not found: ${inputPath}`);
    continue;
  }

  const xml = fs.readFileSync(inputPath, "utf8");
  const osm = parser.parse(xml).osm;

  const nodes = getArray(osm.node);
  const relations = getArray(osm.relation);

  const nodeMap = new Map(
    nodes.map((node) => [
      String(node["@_id"]),
      node,
    ])
  );

  // Find the relation containing Blue Line stop nodes
  const relation = relations.find((item) =>
    getArray(item.member).some(
      (member) =>
        member["@_type"] === "node" &&
        member["@_role"] === "stop"
    )
  );

  if (!relation) {
    console.log(
      `No Blue Line stop relation found in ${file}`
    );
    continue;
  }

  const members = getArray(relation.member);

  for (const member of members) {
    if (
      member["@_type"] !== "node" ||
      member["@_role"] !== "stop"
    ) {
      continue;
    }

    const node = nodeMap.get(
      String(member["@_ref"])
    );

    if (!node) continue;

    const tags = Object.fromEntries(
      getArray(node.tag).map((tag) => [
        tag["@_k"],
        tag["@_v"],
      ])
    );

    if (!tags.name) continue;

    const stationName = normalizeName(tags.name);

    // Avoid duplicate stations from blue.xml and blue1.xml
    if (!stations.has(stationName)) {
      stations.set(stationName, {
        id: stationName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),

        name: stationName,

        line: "Blue",

        location: {
          type: "Point",
          coordinates: [
            Number(node["@_lon"]),
            Number(node["@_lat"]),
          ],
        },
      });
    }
  }
}

const output = [...stations.values()];

fs.writeFileSync(
  outputPath,
  JSON.stringify(output, null, 2)
);

console.log(
  `\nCreated ${output.length} unique Blue Line stations.`
);

console.log(`Saved to: ${outputPath}`);