import mongoose from "mongoose";
import Pandal from "../models/pandal.model.js";
import { getRoute } from "../services/routing.service.js";
import { getMetroRoute } from "../services/metro.service.js";

// Format walking distance
const formatDistance = (distance) => {
  if (distance < 1000) {
    return {
      value: Math.round(distance),
      unit: "m",
    };
  }

  return {
    value: Number((distance / 1000).toFixed(2)),
    unit: "km",
  };
};

// Format walking time
const formatTime = (duration) => {
  const minutes = Math.round(duration / 60);

  return {
    value: Math.max(minutes, 1),
    unit: minutes === 1 ? "minute" : "minutes",
  };
};

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

    // Validate coordinates
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid latitude or longitude",
      });
    }

    // Validate pandal ID
    if (
      !pandalId ||
      !mongoose.Types.ObjectId.isValid(pandalId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid pandal ID",
      });
    }

    // Validate mode
    const profiles = {
      walking: "foot-walking",
      car: "driving-car",
    };

    if (!["walking", "car", "metro"].includes(mode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mode. Use walking, car or metro",
      });
    }

    // Find pandal
    const pandal = await Pandal.findById(pandalId);

    if (!pandal) {
      return res.status(404).json({
        success: false,
        message: "Pandal not found",
      });
    }

    const [destinationLng, destinationLat] =
      pandal.location.coordinates;

    // ==========================================
    // METRO ROUTE
    // ==========================================

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

      const [fromMetroLng, fromMetroLat] =
        metroRoute.fromStation.location.coordinates;

      const [toMetroLng, toMetroLat] =
        metroRoute.toStation.location.coordinates;

      // User → Metro station
      const walkingToMetro = await getRoute(
        {
          longitude: lng,
          latitude: lat,
        },
        {
          longitude: fromMetroLng,
          latitude: fromMetroLat,
        },
        "foot-walking"
      );

      // Metro station → Pandal
      const walkingFromMetro = await getRoute(
        {
          longitude: toMetroLng,
          latitude: toMetroLat,
        },
        {
          longitude: destinationLng,
          latitude: destinationLat,
        },
        "foot-walking"
      );

      const firstLeg = walkingToMetro.features?.[0];
      const lastLeg = walkingFromMetro.features?.[0];

      if (!firstLeg || !lastLeg) {
        return res.status(404).json({
          success: false,
          message:
            "Walking route to or from metro station not found",
        });
      }

      const firstSummary = firstLeg.properties.summary;
      const lastSummary = lastLeg.properties.summary;

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
              distance: formatDistance(firstSummary.distance),
              estimatedTime: formatTime(firstSummary.duration),
              geometry: firstLeg.geometry,
            },

            fromMetro: {
              distance: formatDistance(lastSummary.distance),
              estimatedTime: formatTime(lastSummary.duration),
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

    // ==========================================
    // WALKING / CAR ROUTE
    // ==========================================

    const route = await getRoute(
      {
        longitude: lng,
        latitude: lat,
      },
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

    const { distance, duration } =
      feature.properties.summary;

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