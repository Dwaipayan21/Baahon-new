import mongoose from "mongoose";

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
        validate: {
          validator: (value) =>
            value.length === 2 &&
            Number.isFinite(value[0]) && Number.isFinite(value[1]) &&
            value[0] >= -180 && value[0] <= 180 && //longitude range
            value[1] >= -90 && value[1] <= 90,  //latitue range
          message: "Coordinates must be [longitude, latitude]",
        },
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

const Pandal = mongoose.model("Pandal", pandalSchema);

export default Pandal;