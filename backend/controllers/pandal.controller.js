import Pandal from "../models/pandal.model.js";

// GET /api/pandals
export const getAllPandals = async (req, res, next) => {
  try {
    const pandals = await Pandal.find();

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