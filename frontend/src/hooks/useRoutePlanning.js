import { useEffect, useState } from "react";
import { getRoute, getWalkingRoute } from "../services/api";
import { findNearestPandal } from "../utils/routeUtils";

export const useRoutePlanning = ({
  selectedPandal,
  userLocation,
  selectedPandals,
  setSelectedPandals,
  setMetroActive,
  showToast,
}) => {
  const [routeSegments, setRouteSegments] = useState([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeData, setRouteData] = useState(null);
  const [activeRouteMode, setActiveRouteMode] = useState(null);
  const [routeError, setRouteError] = useState("");
  const [selectedPandalRoute, setSelectedPandalRoute] = useState(null);
  const [selectedPandalRouteLoading, setSelectedPandalRouteLoading] =
    useState(false);

  useEffect(() => {
    if (!selectedPandal || !userLocation) {
      setSelectedPandalRoute(null);
      setSelectedPandalRouteLoading(false);
      return;
    }

    let cancelled = false;

    const loadSelectedPandalWalkingRoute = async () => {
      try {
        setSelectedPandalRouteLoading(true);
        setSelectedPandalRoute(null);

        const route = await getRoute({
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          pandalId: selectedPandal.id,
          mode: "walking",
        });

        if (!cancelled) {
          setSelectedPandalRoute(route);
        }
      } catch (error) {
        console.error(
          "Failed to fetch walking route for selected pandal:",
          error
        );

        if (!cancelled) {
          setSelectedPandalRoute(null);
        }
      } finally {
        if (!cancelled) {
          setSelectedPandalRouteLoading(false);
        }
      }
    };

    loadSelectedPandalWalkingRoute();

    return () => {
      cancelled = true;
    };
  }, [selectedPandal, userLocation]);

  const handleMetroRoute = async () => {
    setRouteError("");

    if (selectedPandals.length === 0) {
      showToast("Select a pandal first");
      return;
    }

    if (!userLocation) {
      showToast("Please use My Location before starting the route");
      return;
    }

    setMetroActive(true);
    setActiveRouteMode("metro");
    setRouteLoading(true);
    setRouteData(null);

    const selectedPandalSnapshot = [...selectedPandals];

    try {
      const routes = [];

      let currentLocation = userLocation;

      for (const pandal of selectedPandalSnapshot) {
        const route = await getRoute({
          latitude: currentLocation.lat,
          longitude: currentLocation.lng,
          pandalId: pandal.id,
          mode: "metro",
        });

        routes.push(route);

        currentLocation = {
          lat: pandal.lat,
          lng: pandal.lng,
        };
      }

      setRouteData(routes.length === 1 ? routes[0] : routes);
    } catch (error) {
      console.error("Metro route failed:", error);

      setRouteError("Metro route is unavailable for this pandal");

      showToast("Metro route is unavailable");
    } finally {
      setRouteLoading(false);
    }
  };

  const handleRoadRoute = async () => {
    setRouteError("");

    if (selectedPandals.length === 0) {
      showToast("Select a pandal first");
      return;
    }

    if (!userLocation) {
      showToast("Please use My Location before starting the route");
      return;
    }

    setMetroActive(false);

    setActiveRouteMode("road");
    setRouteLoading(true);
    setRouteData(null);

    const selectedPandalSnapshot = [...selectedPandals];

    try {
      const routes = [];

      let currentLocation = userLocation;

      for (const pandal of selectedPandalSnapshot) {
        const route = await getRoute({
          latitude: currentLocation.lat,
          longitude: currentLocation.lng,
          pandalId: pandal.id,
          mode: "car",
        });

        routes.push(route);

        currentLocation = {
          lat: pandal.lat,
          lng: pandal.lng,
        };
      }

      setRouteData(routes.length === 1 ? routes[0] : routes);
    } catch (error) {
      console.error("Road route failed:", error);

      setRouteError("Road route is unavailable for this pandal");

      showToast("Could not create road route");
    } finally {
      setRouteLoading(false);
    }
  };

  const handleStartRoute = async () => {
    if (selectedPandals.length === 0) {
      showToast("Add at least one pandal to your route");
      return;
    }

    if (!userLocation) {
      showToast("Please use My Location before starting the route");
      return;
    }

    setRouteLoading(true);

    try {
      const remainingPandals = [...selectedPandals];

      const segments = [];

      let currentLocation = userLocation;

      while (remainingPandals.length > 0) {
        const nearest = findNearestPandal(
          currentLocation,
          remainingPandals
        );

        if (!nearest) {
          break;
        }

        const { pandal } = nearest;

        const route = await getWalkingRoute({
          latitude: currentLocation.lat,
          longitude: currentLocation.lng,
          pandalId: pandal.id,
        });

        segments.push(route);

        currentLocation = {
          lat: route.destination.latitude,
          lng: route.destination.longitude,
        };

        const index = remainingPandals.findIndex(
          (item) => item.id === pandal.id
        );

        remainingPandals.splice(index, 1);
      }

      setRouteSegments(segments);

      const totalDistance = segments.reduce(
        (total, segment) =>
          total + Number(segment.distance?.value || 0),
        0
      );

      const totalTime = segments.reduce(
        (total, segment) =>
          total + Number(segment.estimatedTime?.value || 0),
        0
      );

      showToast(
        `Route ready • ${totalDistance.toFixed(
          1
        )} km • ${totalTime} min`
      );
    } catch (error) {
      console.error("Route creation failed:", error);

      showToast("Could not create walking route");
    } finally {
      setRouteLoading(false);
    }
  };

  const clearRoute = () => {
    setSelectedPandals([]);
    setRouteSegments([]);
    setRouteData(null);
    setRouteError("");
    setActiveRouteMode(null);
    setMetroActive(true);
  };

  return {
    routeSegments,
    routeLoading,
    routeData,
    activeRouteMode,
    routeError,
    selectedPandalRoute,
    selectedPandalRouteLoading,
    handleMetroRoute,
    handleRoadRoute,
    handleStartRoute,
    clearRoute,
  };
};