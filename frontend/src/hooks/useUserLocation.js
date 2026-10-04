import { useEffect, useRef, useState } from "react";
import { getNearbyPandals } from "../services/api";

export const useUserLocation = ({ mapRef, setUserLocation, showToast }) => {
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const locationWatchRef = useRef(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn(
        "Geolocation is not supported by this browser"
      );
      return;
    }

    const handleLocationUpdate = (position) => {
      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      if (
        !Number.isFinite(coords.lat) ||
        !Number.isFinite(coords.lng)
      ) {
        return;
      }

      console.log("AUTO CHECK-IN GPS:", coords);

      setUserLocation(coords);
    };

    const handleLocationError = (error) => {
      console.warn(
        "Automatic location tracking error:",
        error.message
      );
    };

    locationWatchRef.current =
      navigator.geolocation.watchPosition(
        handleLocationUpdate,
        handleLocationError,
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );

    return () => {
      if (locationWatchRef.current !== null) {
        navigator.geolocation.clearWatch(
          locationWatchRef.current
        );

        locationWatchRef.current = null;
      }
    };
  }, [setUserLocation]);

  const handleRecenter = () => {
    if (!navigator.geolocation) {
      showToast(
        "Geolocation is not supported by this browser"
      );
      return;
    }

    setLocationLoading(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        console.log(
          "MY GPS LOCATION:",
          coords
        );

        if (
          !Number.isFinite(coords.lat) ||
          !Number.isFinite(coords.lng) ||
          coords.lat < -90 ||
          coords.lat > 90 ||
          coords.lng < -180 ||
          coords.lng > 180
        ) {
          setLocationError(
            "Invalid GPS coordinates received"
          );

          setLocationLoading(false);

          showToast(
            "Unable to read your location"
          );

          return;
        }

        setUserLocation(coords);

        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [coords.lng, coords.lat],
            zoom: 15,
          });
        }

        try {
          const nearbyPandals =
            await getNearbyPandals({
              latitude: coords.lat,
              longitude: coords.lng,
              maxDistance: 5000,
            });

          console.log(
            "Nearby pandals:",
            nearbyPandals
          );

          showToast(
            `${nearbyPandals.length} nearby ${nearbyPandals.length === 1
              ? "pandal"
              : "pandals"
            } found`
          );
        } catch (error) {
          console.error(
            "Nearby pandal lookup failed:",
            error
          );

          showToast(
            "Could not load nearby pandals"
          );
        }

        setLocationLoading(false);
      },

      (error) => {
        setLocationLoading(false);

        let message =
          "Unable to get your location";

        if (
          error.code ===
          error.PERMISSION_DENIED
        ) {
          message =
            "Location permission was denied";
        } else if (
          error.code ===
          error.POSITION_UNAVAILABLE
        ) {
          message =
            "Your location is currently unavailable";
        } else if (
          error.code === error.TIMEOUT
        ) {
          message =
            "Location request timed out";
        }

        setLocationError(message);

        showToast(message);
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  };

  return {
    handleRecenter,
    locationLoading,
    locationError,
  };
};