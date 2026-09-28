const distanceToKilometers = (distance) => {
  if (distance?.value === undefined || distance?.value === null) return null;
  const value = Number(distance?.value);
  if (!Number.isFinite(value) || value < 0) return null;
  if (distance.unit === "m") return value / 1000;
  if (distance.unit === "km") return value;
  return null;
};

const timeToMinutes = (duration) => {
  if (duration?.value === undefined || duration?.value === null) return null;
  const value = Number(duration?.value);
  if (!Number.isFinite(value) || value < 0) return null;
  if (duration.unit === "second" || duration.unit === "seconds") {
    return Math.ceil(value / 60);
  }
  if (duration.unit === "minute" || duration.unit === "minutes") return value;
  return null;
};

export const getScorecardRouteSummary = ({
  routeData,
  routeSegments = [],
  selectedPandals = [],
  activeRouteMode,
}) => {
  const routeItems = Array.isArray(routeData)
    ? routeData.filter(Boolean)
    : routeData
      ? [routeData]
      : [];
  const routeEntries =
    activeRouteMode === "metro" || activeRouteMode === "road"
      ? routeItems
      : routeSegments.length
        ? routeSegments
        : routeItems;

  if (routeEntries.length === 0) return null;

  const hasExplicitMode = routeEntries.some((route) => route.mode);
  const isMetro =
    routeEntries.some((route) => route.mode === "metro") ||
    (!hasExplicitMode && activeRouteMode === "metro");
  const mode = isMetro
    ? "metro"
    : routeEntries.some((route) => route.mode === "car") ||
      (!hasExplicitMode && activeRouteMode === "road")
      ? "road"
      : "walking";

  const walkingLegs = routeEntries.flatMap((route) =>
    route.mode === "metro"
      ? [route.walking?.toMetro, route.walking?.fromMetro].filter(Boolean)
      : [route]
  );
  const distances = walkingLegs.map((leg) => distanceToKilometers(leg.distance));
  const durations = walkingLegs.map((leg) => timeToMinutes(leg.estimatedTime));
  const totalKilometers =
    distances.length > 0 && distances.every(Number.isFinite)
    ? distances.reduce((total, value) => total + value, 0)
    : null;
  const totalMinutes =
    durations.length > 0 && durations.every(Number.isFinite)
    ? durations.reduce((total, value) => total + value, 0)
    : null;
  const stationCount = routeEntries.reduce(
    (total, route) => total + (route.mode === "metro" ? route.metro?.stations?.length || 0 : 0),
    0
  );

  return {
    mode,
    modeLabel: mode === "metro" ? "Metro + walk" : mode === "road" ? "Road route" : "Walking route",
    distanceMetricLabel: mode === "metro" ? "Walking Distance" : "Route Distance",
    durationMetricLabel: mode === "metro" ? "Walking Time" : "Travel Time",
    distanceLabel:
      totalKilometers === null ? null : `${totalKilometers.toFixed(1)} km`,
    durationLabel: totalMinutes === null ? null : `${totalMinutes} min`,
    stopCount: routeEntries.length || selectedPandals.length,
    stationCount,
  };
};