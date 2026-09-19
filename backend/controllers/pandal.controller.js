import mongoose from "mongoose";
import Pandal from "../models/pandal.model.js";

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

    res.json({
      success: true,
      count: pandals.length,
      data: pandals,
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
    const maxDistance = Number(req.query.maxDistance) || 5000;

    if (
      !Number.isFinite(lng) ||
      !Number.isFinite(lat) ||
      lng < -180 ||
      lng > 180 ||
      lat < -90 ||
      lat > 90
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates",
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

    res.json({
      success: true,
      count: pandals.length,
      data: pandals,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/pandals/:id
export const getPandalById = async (req, res, next) => {
  try {
    const pandal = await Pandal.findById(req.params.id);

    if (!pandal) {
      return res.status(404).json({
        success: false,
        message: "Pandal not found",
      });
    }

    res.json({
      success: true,
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

    res.status(201).json({
      success: true,
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
      return res.status(400).json({
        success: false,
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
      return res.status(404).json({
        success: false,
        message: "Pandal not found",
      });
    }

    res.json({
      success: true,
      message: "Pandal updated successfully",
      data: pandal,
    });
  } catch (error) {
    next(error);
  }
};

//POST /api/pandals
export const createPandal = async (req, res, next) => {
  try {
    const pandal = await Pandal.create(req.body);

    res.status(201).json({
      success: true,
      message: "Pandal created successfully",
      data: pandal,
    });
  } catch (error) {
    next(error);
  }
};

//POST /api.pandals/:id
export const updatePandal = async(req, res, next) => {
  try {
    if(!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success:false,
        message: "Invalid pandal ID",
      });
    }

    const pandal = await Pandal.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new:true,
        runValidators: true,
      }
    );

    if(!pandal){
      return res.status(404).json({
        success:false,
        message: "Pandal not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Pandal Updated Successfully",
      data: pandal,
    });
  } catch (error) {
    next(error);
  }
}