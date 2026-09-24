import mongoose from "mongoose";
import Pandal from "../models/pandal.model.js";
import { getRoute } from "../services/routing.service.js";

export const getRoutePath = async (req, res, next) => {
  try {
    const { latitude, longitude, pandalId, mode = "walking" } = req.query;

    const lat = Number(latitude);
    const lng = Number(longitude);

    // Validate user coordinates
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

    // Validate Pandal ID
    if (!mongoose.Types.ObjectId.isValid(pandalId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pandal ID",
      });
    }

    // Validate route mode
    const profiles = {
      walking: "foot-walking",
      car: "driving-car",
    };

    if (!profiles[mode]) {
      return res.status(400).json({
        success: false,
        message: "Invalid mode. Use walking or car",
      });
    }

    // Find selected Pandal
    const pandal = await Pandal.findById(pandalId);

    if (!pandal) {
      return res.status(404).json({
        success: false,
        message: "Pandal not found",
      });
    }

    const [destinationLng, destinationLat] =
      pandal.location.coordinates;

    // Get dynamic route
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

    const { distance, duration } = feature.properties.summary;

    res.json({
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

        distance: {
          value: Number((distance / 1000).toFixed(2)),
          unit: "km",
        },

        estimatedTime: {
          value: Math.round(duration / 60),
          unit: "minutes",
        },

        geometry: feature.geometry,
      },
    });
  } catch (error) {
    next(error);
  }
};