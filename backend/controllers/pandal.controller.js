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

// GET /api/pandals/nearby
export const getNearbyPandals = async( req, res, next )=> {
  try {
    const lng = Number(req.query.longitude);
    const lat = Number(req.query.latitude);
    const maxDistance = Number(req.query.maxDistance) || 5000; //5km radius by default 

    if(!Number.isFinite(lng) || !Number.isFinite(lat) ||
    lng< -180 || lng > 180 || lat < -90 || lat > 90){
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates",
      });
    }

    const pandals = await Pandal.find({
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [lng,lat] },
          $maxDistance: maxDistance,
        },
      },
    });

    res.json({
      success:true,
      count: pandals.length,
      data: pandals,
    });
  } catch (error) {
    next (error);
  }
}

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