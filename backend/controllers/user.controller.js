import User from "../models/user.model.js";
import CheckIn from "../models/checkin.model.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

export const getCurrentUser = async (req, res, next) => {
  try {
    const clerkId = req.userId;

    if (typeof clerkId !== "string" || !clerkId.trim()) {
      return sendError(res, {
        statusCode: 401,
        message: "Authentication required",
      });
    }

    const user = await User.findOneAndUpdate(
      { clerkId },
      {
        $setOnInsert: {
          clerkId,
          points: 0,
          favourites: [],
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    ).lean();

    const checkIns = await CheckIn.find({ userId: clerkId })
      .populate("pandalId", "_id name category")
      .sort({ createdAt: -1 })
      .lean();

    const visitedPandals = checkIns.map((checkIn) => ({
      pandalId: checkIn.pandalId?._id || checkIn.pandalId,
      pandalName: checkIn.pandalId?.name || "Unknown Pandal",
      category:
        checkIn.category ||
        checkIn.pandalId?.category ||
        "traditional",
      points: checkIn.points,
      checkedInAt: checkIn.createdAt,
    }));

    return sendSuccess(res, {
      message: "User profile fetched successfully",
      data: {
        userId: user.clerkId,
        name: user.name,
        points: user.points,
        totalCheckins: visitedPandals.length,
        visitedPandals,
        favourites: user.favourites,
      },
    });
  } catch (error) {
    next(error);
  }
};