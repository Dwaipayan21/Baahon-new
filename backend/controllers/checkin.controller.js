import mongoose from "mongoose";
import CheckIn from "../models/checkin.model.js";
import Pandal from "../models/pandal.model.js";
import { CHECKIN_CONFIG } from "../config/checkin.config.js";

export const createCheckIn = async (req, res, next) => {
  try {
    const { userId, pandalId, latitude, longitude } = req.body;

    if (!userId?.trim() || typeof userId !== "string") {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(pandalId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pandal ID",
      });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

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
        message: "Invalid coordinates",
      });
    }

    const pandal = await Pandal.findById(pandalId).select(
      "_id name category location"
    );

    if (!pandal) {
      return res.status(404).json({
        success: false,
        message: "Pandal not found",
      });
    }

    const existing = await CheckIn.findOne({
      userId: userId.trim(),
      pandalId: pandal._id,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Already checked in at this pandal",
        data: {
          checkInId: existing._id,
          points: existing.points,
          checkedInAt: existing.createdAt,
        },
      });
    }

    const nearby = await Pandal.exists({
      _id: pandal._id,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          $maxDistance: CHECKIN_CONFIG.PROXIMITY_RADIUS_METERS,
        },
      },
    });

    if (!nearby) {
      return res.status(403).json({
        success: false,
        message: "Too far from pandal to check in",
        data: {
          maxDistanceMeters: CHECKIN_CONFIG.PROXIMITY_RADIUS_METERS,
        },
      });
    }

    const category = (pandal.category || "traditional").trim().toLowerCase();
    const points =
      CHECKIN_CONFIG.POINTS_BY_CATEGORY[category] ??
      CHECKIN_CONFIG.DEFAULT_POINTS;

    try {
      const checkIn = await CheckIn.create({
        userId: userId.trim(),
        pandalId: pandal._id,
        location: {
          type: "Point",
          coordinates: [lng, lat],
        },
        category,
        points,
      });

      return res.status(201).json({
        success: true,
        message: "Check-in successful",
        data: {
          checkInId: checkIn._id,
          pandalId: pandal._id,
          pandalName: pandal.name,
          category,
          points,
          checkedInAt: checkIn.createdAt,
        },
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "Already checked in at this pandal",
        });
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

export const getPandalCheckInCount = async (req, res, next) => {
  try {
    const { pandalId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(pandalId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pandal ID",
      });
    }

    const pandal = await Pandal.findById(pandalId).select("_id name");

    if (!pandal) {
      return res.status(404).json({
        success: false,
        message: "Pandal not found",
      });
    }

    const visitorCount = await CheckIn.countDocuments({ pandalId });

    res.json({
      success: true,
      data: {
        pandalId: pandal._id,
        pandalName: pandal.name,
        visitorCount,
      },
    });
  } catch (error) {
    next(error);
  }
};
export const getUserCheckIns = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId?.trim()) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const checkIns = await CheckIn.find({
      userId: userId.trim(),
    })
      .populate("pandalId", "_id name category")
      .sort({ createdAt: -1 });

    const visits = checkIns.map((checkIn) => ({
      checkInId: checkIn._id,
      pandalId: checkIn.pandalId?._id || checkIn.pandalId,
      pandalName: checkIn.pandalId?.name || "Unknown Pandal",
      category:
        checkIn.category ||
        checkIn.pandalId?.category ||
        "traditional",
      points: checkIn.points,
      checkedInAt: checkIn.createdAt,
    }));

    const totalPoints = visits.reduce(
      (total, visit) => total + (Number(visit.points) || 0),
      0
    );

    return res.json({
      success: true,
      data: {
        visits,
        totalPoints,
        visitedCount: visits.length,
      },
    });
  } catch (error) {
    next(error);
  }
};