import CheckIn from "../models/checkin.model.js";

export const getScoreboard = async (req, res, next) => {
  try {
    const scoreboard = await CheckIn.aggregate([
      {
        $group: {
          _id: "$userId",
          points: { $sum: "$points" },
          checkins: { $sum: 1 },
        },
      },
      {
        $sort: {
          points: -1,
          checkins: -1,
        },
      },
    ]);

    const data = scoreboard.map((user, index) => ({
      rank: index + 1,
      userId: user._id,
      points: user.points,
      checkins: user.checkins,
    }));

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};