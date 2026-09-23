const ORS_URL ="https://api.heigit.org/openrouteservice/v2/directions/foot-walking/geojson";

export const getWalkingRoute = async (start, end) => {
  const response = await fetch(ORS_URL, {
    method: "POST",
    headers: {
      Authorization: process.env.OPENROUTESERVICE_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      coordinates: [
        [start.longitude, start.latitude],
        [end.longitude, end.latitude],
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Routing service error: ${error}`);
  }

  return response.json();
};