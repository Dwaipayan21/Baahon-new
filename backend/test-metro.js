import {
  findNearestStation,
  findMetroPath,
  getMetroRoute,
} from "./services/metro.service.js";

console.log("\n================================");
console.log("       METRO SERVICE TEST");
console.log("================================\n");

// --------------------------------------------------
// TEST 1: Find nearest metro station
// --------------------------------------------------

console.log("TEST 1: Nearest Metro Station");

const nearest = findNearestStation(
  22.5809,
  88.4290
);

console.log(
  JSON.stringify(nearest, null, 2)
);


// --------------------------------------------------
// TEST 2: Green Line route
// --------------------------------------------------

console.log("\nTEST 2: Green Line Route");

const greenRoute = findMetroPath(
  "Salt Lake Sector V",
  "Esplanade"
);

console.log(
  JSON.stringify(greenRoute, null, 2)
);


// --------------------------------------------------
// TEST 3: Green → Blue Line Interchange
// --------------------------------------------------

console.log("\nTEST 3: Green → Blue Interchange");

const interchangeRoute = findMetroPath(
  "Esplanade",
  "Dum Dum"
);

if (!interchangeRoute) {
  console.log(
    "❌ No Green → Blue route found."
  );
} else {
  console.log(
    JSON.stringify(interchangeRoute, null, 2)
  );

  console.log("\nInterchange summary:");

  console.log(
    `Lines: ${interchangeRoute.lines.join(" → ")}`
  );

  console.log(
    `Transfers: ${interchangeRoute.transfers}`
  );

  console.log(
    "Stations:"
  );

  console.log(
    interchangeRoute.stations
      .map((station) => station.name)
      .join(" → ")
  );
}


// --------------------------------------------------
// TEST 4: Complete GPS → Metro → GPS
// --------------------------------------------------

console.log(
  "\nTEST 4: Complete GPS → Metro → GPS"
);

const completeRoute = getMetroRoute({
  // Salt Lake Sector V area
  fromLatitude: 22.5809,
  fromLongitude: 88.4290,

  // Dum Dum area
  toLatitude: 22.6527,
  toLongitude: 88.4407,
});

if (!completeRoute) {
  console.log(
    "❌ No complete metro route found."
  );
} else {
  console.log(
    JSON.stringify(
      completeRoute,
      null,
      2
    )
  );

  console.log("\nRoute summary:");

  console.log(
    `From: ${completeRoute.fromStation.name}`
  );

  console.log(
    `To: ${completeRoute.toStation.name}`
  );

  console.log(
    `Lines: ${completeRoute.lines.join(" → ")}`
  );

  console.log(
    `Transfers: ${completeRoute.transfers}`
  );

  console.log(
    `Walk to Metro: ${completeRoute.walkingToMetro} m`
  );

  console.log(
    `Walk from Metro: ${completeRoute.walkingFromMetro} m`
  );

  console.log("\nMetro stations:");

  console.log(
    completeRoute.stations
      .map((station) => station.name)
      .join(" → ")
  );
}

console.log(
  "\n================================"
);
console.log(
  "          TEST COMPLETE"
);
console.log(
  "================================\n"
);