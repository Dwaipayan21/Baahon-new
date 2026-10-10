import { useEffect, useRef, useState } from "react";
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

  const selectedRouteRequestIdRef = useRef(0);
  const lastRouteRequestRef = useRef(null);
  const previousSelectedPandalIdRef = useRef(null);

  useEffect(() => {
    const pandalId = selectedPandal?.id;

    if (!pandalId) {
      selectedRouteRequestIdRef.current += 1;
      previousSelectedPandalIdRef.current = null;
      lastRouteRequestRef.current = null;

      setSelectedPandalRoute(null);
      setSelectedPandalRouteLoading(false);
      return;
    }

    const isNewPandal =
      previousSelectedPandalIdRef.current !== pandalId;

    if (isNewPandal) {
      selectedRouteRequestIdRef.current += 1;
      previousSelectedPandalIdRef.current = pandalId;
      lastRouteRequestRef.current = null;

      setSelectedPandalRoute(null);
      setSelectedPandalRouteLoading(false);
    }

    if (
      !userLocation ||
      !Number.isFinite(userLocation.lat) ||
      !Number.isFinite(userLocation.lng)
    ) {
      return;
    }

    const { lat, lng } = userLocation;
    const lastRequest = lastRouteRequestRef.current;

    if (
      lastRequest &&
      lastRequest.pandalId === pandalId
    ) {
      const toRadians = (degrees) => (degrees * Math.PI) / 180;
      const earthRadius = 6371000;

      const latitudeDifference = toRadians(
        lat - lastRequest.lat
      );
      const longitudeDifference = toRadians(
        lng - lastRequest.lng
      );

      const a =
        Math.sin(latitudeDifference / 2) ** 2 +
        Math.cos(toRadians(lastRequest.lat)) *
          Math.cos(toRadians(lat)) *
          Math.sin(longitudeDifference / 2) ** 2;

      const distanceMoved =
        2 *
        earthRadius *
        Math.atan2(
          Math.sqrt(a),
          Math.sqrt(Math.max(0, 1 - a))
        );

      if (distanceMoved < 150) {
        return;
      }
    }

    const requestId = ++selectedRouteRequestIdRef.current;

    lastRouteRequestRef.current = {
      pandalId,
      lat,
      lng,
    };

    const loadRoute = async () => {
      setSelectedPandalRouteLoading(true);

      try {
        const route = await getRoute({
          latitude: lat,
          longitude: lng,
          pandalId,
          mode: "walking",
        });

        if (
          requestId !== selectedRouteRequestIdRef.current ||
          previousSelectedPandalIdRef.current !== pandalId
        ) {
          return;
        }

        if (
          route?.distance?.value != null &&
          route?.estimatedTime?.value != null
        ) {
          setSelectedPandalRoute(route);
        } else {
          console.warn(
            "Walking route response was incomplete:",
            route
          );
        }
      } catch (error) {
        console.error(
          "Failed to fetch walking route for selected pandal:",
          error
        );
      } finally {
        if (
          requestId === selectedRouteRequestIdRef.current
        ) {
          setSelectedPandalRouteLoading(false);
        }
      }
    };

    loadRoute();
  }, [
    selectedPandal?.id,
    userLocation?.lat,
    userLocation?.lng,
  ]);

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