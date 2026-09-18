import Pandal from "../models/pandal.model.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/pandals
export const getAllPandals = async (req, res, next) => {
  try {
    const {search, area, category} = req.query;
    const filter = {};

    //search by pandal name , area or address
    if(search?.trim()){
      const regex = new RegExp(escapeRegex(search.trim()), "i");

      filter.$or = [
        {name : regex},
        {area: regex},
        {address: regex},
      ];
    }

    //filter by area 
    if(area?.trim()){
      filter.area = new RegExp(`^${escapeRegex(area.trim())}$`, "i");
    }

    //filter by category 
    if(category?.trim()){
      filter.category = new RegExp(`^${escapeRegex(category.trim())}$`, "i");
    }

    const pandals = await Pandal.find(filter);

    res.status(200).json({
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

    res.status(200).json({
      success: true,
      data: pandal,
    });
  } catch (error) {
    next(error);
  }
};