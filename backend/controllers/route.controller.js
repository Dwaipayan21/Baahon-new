import mongoose from "mongoose";
import Pandal from "../models/pandal.model.js";
import { getRoute } from "../services/routing.service.js";
import { getMetroRoute } from "../services/metro.service.js";

const profiles = {
  walking: "foot-walking",
  car: "driving-car",
};

const formatDistance = (distance) =>
  distance < 1000
    ? { value: Math.round(distance), unit: "m" }
    : { value: Number((distance / 1000).toFixed(2)), unit: "km" };

const formatTime = (duration) => {
  const minutes = Math.max(Math.round(duration / 60), 1);
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
    Math.sin(dLng / 2) ** 2 *
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180);

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const validCoordinates = (lat, lng) =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  lat >= -90 &&
  lat <= 90 &&
  lng >= -180 &&
  lng <= 180;

const getPandalIds = (ids) =>
  ids.filter((id) => mongoose.Types.ObjectId.isValid(id));

export const getRoutePath = async (req, res, next) => {
  try {
    const {
      latitude,
      longitude,
      pandalId,
      mode = "walking",
    } = req.query;

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!validCoordinates(lat, lng)) {
      return res.status(400).json({
        success: false,
        message: "Invalid latitude or longitude",
      });
    }

    if (!pandalId || !mongoose.Types.ObjectId.isValid(pandalId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pandal ID",
      });
    }

    if (!["walking", "car", "metro"].includes(mode)) {
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

    const [destinationLng, destinationLat] =
      pandal.location.coordinates;

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

    const route = await getRoute(
      { longitude: lng, latitude: lat },
      { longitude: destinationLng, latitude: destinationLat },
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

export const getNextPandalRoute = async (req, res, next) => {
  try {
    const {
      latitude,
      longitude,
      selectedPandalIds,
      visitedPandalIds = [],
      mode = "walking",
    } = req.body;

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!validCoordinates(lat, lng)) {
      return res.status(400).json({
        success: false,
        message: "Invalid latitude or longitude",
      });
    }

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

    const allIds = [...selectedPandalIds, ...visitedPandalIds];

    if (getPandalIds(allIds).length !== allIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more pandal IDs are invalid",
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
      (pandal) => !visited.has(pandal._id.toString())
    );

    if (!remaining.length) {
      return res.json({
        success: true,
        data: {
          completed: true,
          start: { latitude: lat, longitude: lng },
          visitedPandalIds,
          remainingPandalIds: [],
          nextPandal: null,
          route: null,
        },
      });
    }

    let nearest = remaining[0];
    let nearestDistance = Infinity;

    for (const pandal of remaining) {
      const [pandalLng, pandalLat] =
        pandal.location.coordinates;

      const distance = calculateDistance(
        lat,
        lng,
        pandalLat,
        pandalLng
      );

      if (distance < nearestDistance) {
        nearest = pandal;
        nearestDistance = distance;
      }
    }

    const [destinationLng, destinationLat] =
      nearest.location.coordinates;

    const route = await getRoute(
      { longitude: lng, latitude: lat },
      { longitude: destinationLng, latitude: destinationLat },
      profiles[mode]
    );

    const feature = route.features?.[0];

    if (!feature) {
      return res.status(404).json({
        success: false,
        message: "Route to next pandal not found",
      });
    }

    const { distance, duration } = feature.properties.summary;

    return res.json({
      success: true,
      data: {
        completed: false,

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
          latitude: destinationLat,
          longitude: destinationLng,
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