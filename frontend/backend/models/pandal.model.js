const mongoose = require("mongoose");

const pandalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
    },

    area: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      default: "",
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },

      coordinates: {
        type: [Number],
        required: true,
      },
    },

    category: {
      type: String,
      default: "traditional",
    },

    metroStation: {
      type: String,
      default: "",
    },

    verified: {
      type: Boolean,
      default: false,
    },

    source: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

pandalSchema.index({
  location: "2dsphere",
});

module.exports = mongoose.model("Pandal", pandalSchema);