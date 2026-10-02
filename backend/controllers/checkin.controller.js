import mongoose from "mongoose";
import CheckIn from "../models/checkin.model.js";
import Pandal from "../models/pandal.model.js";
import User from "../models/user.model.js";
import { CHECKIN_CONFIG } from "../config/checkin.config.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

export const createCheckIn = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { pandalId, latitude, longitude } = req.body;

    if (!userId || typeof userId !== "string") {
      return sendError(res, {
        statusCode: 401,
        message: "Authentication required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(pandalId)) {
      return sendError(res, {
        statusCode: 400,
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
      return sendError(res, {
        statusCode: 400,
        message: "Invalid coordinates",
      });
    }

    const pandal = await Pandal.findById(pandalId).select(
      "_id name category location"
    );

    if (!pandal) {
      return sendError(res, {
        statusCode: 404,
        message: "Pandal not found",
      });
    }

    const existing = await CheckIn.findOne({
      userId,
      pandalId: pandal._id,
    });

    if (existing) {
      return sendError(res, {
        statusCode: 409,
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
      return sendError(res, {
        statusCode: 403,
        message: "Too far from pandal to check in",
        data: {
          maxDistanceMeters: CHECKIN_CONFIG.PROXIMITY_RADIUS_METERS,
        },
      });
    }

    const category = (pandal.category || "traditional")
      .trim()
      .toLowerCase();

    const points =
      CHECKIN_CONFIG.POINTS_BY_CATEGORY[category] ??
      CHECKIN_CONFIG.DEFAULT_POINTS;

    try {
      const checkIn = await CheckIn.create({
        userId,
        pandalId: pandal._id,
        location: {
          type: "Point",
          coordinates: [lng, lat],
        },
        category,
        points,
      });

      await User.findOneAndUpdate(
        { clerkId: userId },
        { $inc: { points } },
        {
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

      return sendSuccess(res, {
        statusCode: 201,
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
        return sendError(res, {
          statusCode: 409,
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
      return sendError(res, {
        statusCode: 400,
        message: "Invalid pandal ID",
      });
    }

    const pandal = await Pandal.findById(pandalId).select("_id name");

    if (!pandal) {
      return sendError(res, {
        statusCode: 404,
        message: "Pandal not found",
      });
    }

    const visitorCount = await CheckIn.countDocuments({ pandalId });

    return sendSuccess(res, {
      message: "Pandal check-in count fetched successfully",
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
    const userId = req.userId;

    if (!userId || typeof userId !== "string") {
      return sendError(res, {
        statusCode: 401,
        message: "Authentication required",
      });
    }

    const checkIns = await CheckIn.find({ userId })
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

    return sendSuccess(res, {
      message: "User check-ins fetched successfully",
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