import "dotenv/config";

const url =
  "https://routes.googleapis.com/directions/v2:computeRoutes";

const response = await fetch(url, {
  method: "POST",

  headers: {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY,

    "X-Goog-FieldMask":
      "routes.duration,routes.staticDuration,routes.distanceMeters",
  },

  body: JSON.stringify({
    origin: {
      location: {
        latLng: {
          latitude: 22.5726,
          longitude: 88.3639,
        },
      },
    },

    destination: {
      location: {
        latLng: {
          latitude: 22.5448,
          longitude: 88.3426,
        },
      },
    },

    travelMode: "DRIVE",

    routingPreference: "TRAFFIC_AWARE",
  }),
});

const data = await response.json();

console.log("HTTP STATUS:", response.status);
console.log(JSON.stringify(data, null, 2));