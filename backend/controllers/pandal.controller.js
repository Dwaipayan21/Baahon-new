import mongoose from "mongoose";
import Pandal from "../models/pandal.model.js";
import {
  getPandalCrowdStatus,
  getPandalCrowdStatuses,
} from "../services/crowd/crowdAggregation.service.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/pandals
export const getAllPandals = async (req, res, next) => {
  try {
    const { search, area, category } = req.query;
    const filter = {};

    if (search?.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), "i");
      filter.$or = [{ name: regex }, { area: regex }, { address: regex }];
    }

    if (area?.trim()) {
      filter.area = new RegExp(`^${escapeRegex(area.trim())}$`, "i");
    }

    if (category?.trim()) {
      filter.category = new RegExp(`^${escapeRegex(category.trim())}$`, "i");
    }

    const pandals = await Pandal.find(filter);

    return sendSuccess(res, {
      message: "Pandals fetched successfully",
      data: pandals,
      count: pandals.length,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/pandals/crowd
export const getAllPandalCrowd = async (req, res, next) => {
  try {
    const pandals = await Pandal.find().select(
      "_id name crowdSamplePoints"
    );

    const crowdStatuses = await getPandalCrowdStatuses(pandals);

    const data = pandals.map((pandal, index) => ({
      pandalId: pandal._id,
      pandalName: pandal.name,
      ...crowdStatuses[index],
    }));

    for (const pandal of data) {
      if (pandal.status !== "UNKNOWN") {
        console.log(
          `[CACHE] ${pandal.pandalName} → reused existing crowd observation`
        );
      }
    }

    return sendSuccess(res, {
      message: "Pandal crowd statuses fetched successfully",
      data,
      count: data.length,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/pandals/nearby
export const getNearbyPandals = async (req, res, next) => {
  try {
    const lng = Number(req.query.longitude);
    const lat = Number(req.query.latitude);
    const maxDistance = req.query.maxDistance === undefined ? 5000
    : Number(req.query.maxDistance);

    if (
      !Number.isFinite(lng) ||
      !Number.isFinite(lat) ||
      lng < -180 ||
      lng > 180 ||
      lat < -90 ||
      lat > 90
    ) {
      return sendError(res, {
        statusCode: 400,
        message: "Invalid coordinates",
      });
    }

    if (!Number.isFinite(maxDistance) || maxDistance <= 0) {
      return sendError(res, {
        statusCode: 400,
        message: "Invalid maxDistance. It must be a positive number",
      });
    }

    const pandals = await Pandal.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          $maxDistance: maxDistance,
        },
      },
    });

    return sendSuccess(res, {
      message: "Nearby pandals fetched successfully",
      data: pandals,
      count: pandals.length,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/pandals/:id
export const getPandalById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return sendError(res, {
        statusCode: 400,
        message: "Invalid pandal ID",
      });
    }

    const pandal = await Pandal.findById(req.params.id);

    if (!pandal) {
      return sendError(res, {
        statusCode: 404,
        message: "Pandal not found",
      });
    }

    return sendSuccess(res, {
      message: "Pandal fetched successfully",
      data: pandal,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/pandals
export const createPandal = async (req, res, next) => {
  try {
    const pandal = await Pandal.create(req.body);

    return sendSuccess(res, {
      statusCode: 201,
      message: "Pandal created successfully",
      data: pandal,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/pandals/:id
export const updatePandal = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return sendError(res, {
        statusCode: 400,
        message: "Invalid pandal ID",
      });
    }

    const pandal = await Pandal.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!pandal) {
      return sendError(res, {
        statusCode: 404,
        message: "Pandal not found",
      });
    }

    return sendSuccess(res, {
      message: "Pandal updated successfully",
      data: pandal,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/pandals/:id/crowd
export const getPandalCrowd = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return sendError(res, {
        statusCode: 400,
        message: "Invalid pandal ID",
      });
    }

    const pandal = await Pandal.findById(req.params.id).select(
      "_id name crowdSamplePoints"
    );

    if (!pandal) {
      return sendError(res, {
        statusCode: 404,
        message: "Pandal not found",
      });
    }

    const crowd = await getPandalCrowdStatus(pandal);

    if (crowd.status !== "UNKNOWN") {
      console.log(
        `[CACHE] ${pandal.name} → reused existing crowd observation`
      );
    }

    return sendSuccess(res, {
      message: "Pandal crowd status fetched successfully",
      data: {
        pandalId: pandal._id,
        pandalName: pandal.name,
        ...crowd,
      },
    });
  } catch (error) {
    next(error);
  }
};


