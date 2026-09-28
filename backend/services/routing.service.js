const ORS_BASE_URL =
  "https://api.heigit.org/openrouteservice/v2/directions";

export const getRoute = async (
  start,
  end,
  profile = "foot-walking"
) => {
  const allowedProfiles = ["foot-walking", "driving-car"];

  if (!allowedProfiles.includes(profile)) {
    throw new Error(`Unsupported routing profile: ${profile}`);
  }

  const response = await fetch(
    `${ORS_BASE_URL}/${profile}/geojson`,
    {
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
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Routing service error: ${error}`);
  }

  return response.json();
};