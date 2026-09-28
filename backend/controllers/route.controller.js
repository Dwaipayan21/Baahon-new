import mongoose from "mongoose";
import Pandal from "../models/pandal.model.js";
import { getRoute } from "../services/routing.service.js";
import { getMetroRoute } from "../services/metro.service.js";

const profiles = {
  walking: "foot-walking",
  car: "driving-car",
};

const validModes = ["walking", "car", "metro"];

const validCoordinates = (lat, lng) =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  lat >= -90 &&
  lat <= 90 &&
  lng >= -180 &&
  lng <= 180;

const parseCoordinates = (latitude, longitude) => {
  if (
    latitude === undefined ||
    latitude === null ||
    latitude === "" ||
    longitude === undefined ||
    longitude === null ||
    longitude === ""
  ) {
    return null;
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  return validCoordinates(lat, lng) ? { lat, lng } : null;
};

const getPandalCoordinates = (pandal) => {
  const coordinates = pandal?.location?.coordinates;

  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return null;
  }

  const [lng, lat] = coordinates;

  return validCoordinates(lat, lng)
    ? { latitude: lat, longitude: lng }
    : null;
};

const formatDistance = (distance) =>
  distance < 1000
    ? { value: Math.round(distance), unit: "m" }
    : { value: Number((distance / 1000).toFixed(2)), unit: "km" };

const formatTime = (duration) => {
  const minutes = Math.max(Math.ceil(duration / 60), 1);

  return {
    value: minutes,
    unit: minutes === 1 ? "minute" : "minutes",
  };
};

const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const hasDuplicateIds = (ids) =>
  new Set(ids.map(String)).size !== ids.length;

// GET /api/path
export const getRoutePath = async (req, res, next) => {
  try {
    const {
      latitude,
      longitude,
      pandalId,
      mode = "walking",
    } = req.query;

    const coordinates = parseCoordinates(latitude, longitude);

    if (!coordinates) {
      return res.status(400).json({
        success: false,
        message: "Invalid latitude or longitude",
      });
    }

    // FIX: lat and lng are now available in the whole function
    const { lat, lng } = coordinates;

    if (!pandalId || !mongoose.Types.ObjectId.isValid(pandalId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pandal ID",
      });
    }

    if (!validModes.includes(mode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mode. Use walking, car or metro",
      });
    }

    const pandal = await Pandal.findById(pandalId);

    if (!pandal) {
      return res.status(404).json({
        success: false,
        message: "Pandal not found",
      });
    }

    const destination = getPandalCoordinates(pandal);

    if (!destination) {
      return res.status(500).json({
        success: false,
        message: "Pandal has invalid coordinates",
      });
    }

    const {
      latitude: destinationLat,
      longitude: destinationLng,
    } = destination;

    // ---------------- METRO ----------------

    if (mode === "metro") {
      const metroRoute = getMetroRoute({
        fromLatitude: lat,
        fromLongitude: lng,
        toLatitude: destinationLat,
        toLongitude: destinationLng,
      });

      if (!metroRoute) {
        return res.status(404).json({
          success: false,
          message: "No metro route available for this journey",
        });
      }

      const [fromLng, fromLat] =
        metroRoute.fromStation.location.coordinates;

      const [toLng, toLat] =
        metroRoute.toStation.location.coordinates;

      const [toMetro, fromMetro] = await Promise.all([
        getRoute(
          { longitude: lng, latitude: lat },
          { longitude: fromLng, latitude: fromLat },
          "foot-walking"
        ),
        getRoute(
          { longitude: toLng, latitude: toLat },
          { longitude: destinationLng, latitude: destinationLat },
          "foot-walking"
        ),
      ]);

      const firstLeg = toMetro.features?.[0];
      const lastLeg = fromMetro.features?.[0];

      if (!firstLeg || !lastLeg) {
        return res.status(404).json({
          success: false,
          message: "Walking route to or from metro station not found",
        });
      }

      const first = firstLeg.properties.summary;
      const last = lastLeg.properties.summary;

      return res.json({
        success: true,
        data: {
          mode: "metro",
          targetPandalId: pandal._id,

          start: {
            latitude: lat,
            longitude: lng,
          },

          destination: {
            pandalId: pandal._id,
            name: pandal.name,
            latitude: destinationLat,
            longitude: destinationLng,
          },

          walking: {
            toMetro: {
              distance: formatDistance(first.distance),
              estimatedTime: formatTime(first.duration),
              geometry: firstLeg.geometry,
            },

            fromMetro: {
              distance: formatDistance(last.distance),
              estimatedTime: formatTime(last.duration),
              geometry: lastLeg.geometry,
            },
          },

          metro: {
            fromStation: metroRoute.fromStation,
            toStation: metroRoute.toStation,
            stations: metroRoute.stations,
            lines: metroRoute.lines,
            transfers: metroRoute.transfers,
          },
        },
      });
    }

    // ---------------- WALKING / CAR ----------------

    const route = await getRoute(
      { longitude: lng, latitude: lat },
      {
        longitude: destinationLng,
        latitude: destinationLat,
      },
      profiles[mode]
    );

    const feature = route.features?.[0];

    if (!feature) {
      return res.status(404).json({
        success: false,
        message: "Route not found",
      });
    }

    const { distance, duration } = feature.properties.summary;

    return res.json({
      success: true,
      data: {
        mode,
        targetPandalId: pandal._id,

        start: {
          latitude: lat,
          longitude: lng,
        },

        destination: {
          pandalId: pandal._id,
          name: pandal.name,
          latitude: destinationLat,
          longitude: destinationLng,
        },

        distance: formatDistance(distance),
        estimatedTime: formatTime(duration),
        geometry: feature.geometry,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/path/next
export const getNextPandalRoute = async (req, res, next) => {
  try {
    const {
      latitude,
      longitude,
      selectedPandalIds,
      visitedPandalIds = [],
      mode = "walking",
    } = req.body;

    const coordinates = parseCoordinates(latitude, longitude);

    if (!coordinates) {
      return res.status(400).json({
        success: false,
        message: "Invalid latitude or longitude",
      });
    }

    const { lat, lng } = coordinates;

    if (!Array.isArray(selectedPandalIds) || !selectedPandalIds.length) {
      return res.status(400).json({
        success: false,
        message: "At least one selected pandal is required",
      });
    }

    if (!Array.isArray(visitedPandalIds)) {
      return res.status(400).json({
        success: false,
        message: "visitedPandalIds must be an array",
      });
    }

    const allIds = [
      ...selectedPandalIds,
      ...visitedPandalIds,
    ];

    if (
      allIds.some(
        (id) => !mongoose.Types.ObjectId.isValid(id)
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "One or more pandal IDs are invalid",
      });
    }

    if (
      hasDuplicateIds(selectedPandalIds) ||
      hasDuplicateIds(visitedPandalIds)
    ) {
      return res.status(400).json({
        success: false,
        message: "Duplicate pandal IDs are not allowed",
      });
    }

    // Visited pandals must belong to the selected list
    const selectedSet = new Set(
      selectedPandalIds.map(String)
    );

    if (
      visitedPandalIds.some(
        (id) => !selectedSet.has(String(id))
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "visitedPandalIds must belong to selectedPandalIds",
      });
    }

    if (!["walking", "car"].includes(mode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mode. Use walking or car",
      });
    }

    const pandals = await Pandal.find({
      _id: { $in: selectedPandalIds },
    });

    if (pandals.length !== selectedPandalIds.length) {
      return res.status(404).json({
        success: false,
        message: "One or more selected pandals were not found",
      });
    }

    const visited = new Set(
      visitedPandalIds.map(String)
    );

    const remaining = pandals.filter(
      (pandal) => !visited.has(String(pandal._id))
    );

    // All selected pandals have been visited
    if (!remaining.length) {
      return res.json({
        success: true,
        data: {
          completed: true,
          start: {
            latitude: lat,
            longitude: lng,
          },
          visitedPandalIds,
          remainingPandalIds: [],
          nextPandal: null,
          route: null,
        },
      });
    }

    // Find nearest remaining pandal
    let nearest = null;
    let nearestDistance = Infinity;

    for (const pandal of remaining) {
      const coordinates = getPandalCoordinates(pandal);

      if (!coordinates) continue;

      const distance = calculateDistance(
        lat,
        lng,
        coordinates.latitude,
        coordinates.longitude
      );

      if (distance < nearestDistance) {
        nearest = pandal;
        nearestDistance = distance;
      }
    }

    if (!nearest) {
      return res.status(500).json({
        success: false,
        message: "No remaining pandal has valid coordinates",
      });
    }

    const destination = getPandalCoordinates(nearest);

    const route = await getRoute(
      { longitude: lng, latitude: lat },
      {
        longitude: destination.longitude,
        latitude: destination.latitude,
      },
      profiles[mode]
    );

    const feature = route.features?.[0];

    if (!feature) {
      return res.status(404).json({
        success: false,
        message: "Route to next pandal not found",
      });
    }

    const { distance, duration } =
      feature.properties.summary;

    return res.json({
      success: true,
      data: {
        completed: false,
        targetPandalId: nearest._id,

        start: {
          latitude: lat,
          longitude: lng,
        },

        visitedPandalIds,

        remainingPandalIds: remaining.map(
          (pandal) => pandal._id
        ),

        nextPandal: {
          pandalId: nearest._id,
          name: nearest.name,
          latitude: destination.latitude,
          longitude: destination.longitude,
        },

        distanceFromUser: formatDistance(
          nearestDistance * 1000
        ),

        route: {
          mode,
          distance: formatDistance(distance),
          estimatedTime: formatTime(duration),
          geometry: feature.geometry,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};