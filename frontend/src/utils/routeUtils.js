const toRadians = (value) => (value * Math.PI) / 180;

export const calculateDistanceKm = (lat1, lng1, lat2, lng2) => {
  const earthRadius = 6371;

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return (
    earthRadius *
    2 *
    Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  );
};

export const findNearestPandal = (location, pandals) => {
  if (!location || !pandals?.length) return null;

  return pandals.reduce((nearest, pandal) => {
    const distance = calculateDistanceKm(
      location.lat,
      location.lng,
      pandal.lat,
      pandal.lng
    );

    if (!nearest || distance < nearest.distanceKm) {
      return {
        pandal,
        distanceKm: distance,
      };
    }

    return nearest;
  }, null);
};