import "dotenv/config";
import { getRoute } from "./services/routing.service.js";

const start = {
  longitude: 88.3639,
  latitude: 22.5726,
};

const end = {
  longitude: 88.3668,
  latitude: 22.6012,
};

try {
  const route = await getRoute(start, end);

  console.log("Route request successful!");
  console.log(JSON.stringify(route, null, 2));
} catch (error) {
  console.error("Route request failed:");
  console.error(error.message);
}