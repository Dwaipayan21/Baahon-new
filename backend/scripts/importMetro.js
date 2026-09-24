import fs from "fs";
import path from "path";
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
});

const files = ["green.xml", "green1.xml"];

const stations = new Map();

const getArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

for (const file of files) {
  const filePath = path.resolve("data/metro", file);

  console.log(`Reading ${file}...`);

  const xml = fs.readFileSync(filePath, "utf8");
  const osm = parser.parse(xml).osm;

  const nodes = getArray(osm.node);
  const relations = getArray(osm.relation);

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

  const members = getArray(relation.member);

  for (const member of members) {
    if (
      member["@_type"] !== "node" ||
      member["@_role"] !== "stop"
    ) {
      continue;
    }

    const node = nodes.find(
      (item) =>
        String(item["@_id"]) === String(member["@_ref"])
    );

    if (!node) continue;

    const tags = Object.fromEntries(
      getArray(node.tag).map((tag) => [
        tag["@_k"],
        tag["@_v"],
      ])
    );

    if (!tags.name) continue;

    // Normalize station name
    const stationName = tags.name
      .replace(/\s*\(Line 2\)\s*/i, "")
      .trim();

    // Use station name as the unique key
    if (!stations.has(stationName)) {
      stations.set(stationName, {
        id: stationName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),

        name: stationName,

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
  }
}

const output = [...stations.values()];

const outputPath = path.resolve(
  "data/metro/green-line.json"
);

fs.writeFileSync(
  outputPath,
  JSON.stringify(output, null, 2)
);

console.log(`\nCreated ${output.length} unique stations.`);
console.log(`Saved to: ${outputPath}`);